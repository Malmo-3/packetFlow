import { describe, it, expect } from "vitest";
import { agent, authHeader, createUser } from "./helpers";

async function createTripAssignedTo(carrierId: string, adminHeader: Record<string, string>) {
  const res = await agent()
    .post("/api/v1/trips")
    .set(adminHeader)
    .send({
      name: "Malmö loop",
      startCity: "Malmö",
      endCity: "Lund",
      stops: ["Staffanstorp"],
      assignedCarrier: carrierId,
    });
  return res;
}

describe("trips — carrier scope + forward-only status", () => {
  it("returns raw objects/arrays (no success envelope) to match the backend-client", async () => {
    const admin = await createUser("admin");
    const list = await agent().get("/api/v1/trips").set(authHeader(admin));
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
  });

  it("admin creates a trip and the carrier sees it via /trips/my", async () => {
    const admin = await createUser("admin");
    const carrier = await createUser("carrier");

    const created = await createTripAssignedTo(String(carrier._id), authHeader(admin));
    expect(created.status).toBe(201);
    expect(created.body.name).toBe("Malmö loop");

    const mine = await agent().get("/api/v1/trips/my").set(authHeader(carrier));
    expect(mine.status).toBe(200);
    expect(mine.body).toHaveLength(1);

    const otherCarrier = await createUser("carrier");
    const none = await agent()
      .get("/api/v1/trips/my")
      .set(authHeader(otherCarrier));
    expect(none.body).toHaveLength(0);
  });

  it("lets the assigned carrier advance status forward but not backward", async () => {
    const admin = await createUser("admin");
    const carrier = await createUser("carrier");
    const created = await createTripAssignedTo(String(carrier._id), authHeader(admin));
    const id = created.body._id;

    const forward = await agent()
      .patch(`/api/v1/trips/${id}/status`)
      .set(authHeader(carrier))
      .send({ status: "active" });
    expect(forward.status).toBe(200);
    expect(forward.body.status).toBe("active");

    const backward = await agent()
      .patch(`/api/v1/trips/${id}/status`)
      .set(authHeader(carrier))
      .send({ status: "planned" });
    expect(backward.status).toBe(400);
  });

  it("forbids a non-assigned carrier from changing a trip's status", async () => {
    const admin = await createUser("admin");
    const carrier = await createUser("carrier");
    const intruder = await createUser("carrier");
    const created = await createTripAssignedTo(String(carrier._id), authHeader(admin));
    const id = created.body._id;

    const res = await agent()
      .patch(`/api/v1/trips/${id}/status`)
      .set(authHeader(intruder))
      .send({ status: "active" });
    expect(res.status).toBe(403);
  });

  it("forbids a non-admin from creating a trip", async () => {
    const sender = await createUser("sender");
    const res = await agent()
      .post("/api/v1/trips")
      .set(authHeader(sender))
      .send({ name: "X", startCity: "Malmö", endCity: "Lund" });
    expect(res.status).toBe(403);
  });
});
