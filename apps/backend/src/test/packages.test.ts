import { describe, it, expect } from "vitest";
import { agent, authHeader, createUser, samplePackageBody } from "./helpers";

describe("packages — contract + authorization", () => {
  it("creates a package, resolving depots and tracking number server-side", async () => {
    const sender = await createUser("sender");
    const res = await agent()
      .post("/api/v1/packages")
      .set(authHeader(sender))
      .send(samplePackageBody());

    expect(res.status).toBe(201);
    const pkg = res.body.data;
    expect(pkg.trackingNumber).toMatch(/^PKT-[A-Z0-9]{8}$/);
    expect(pkg.dropOffPoint).toContain("Malmö");
    expect(pkg.pickUpPoint).toContain("Lund");
    expect(pkg.status).toBe("registered");
  });

  it("rejects non-Skåne cities with 400", async () => {
    const sender = await createUser("sender");
    const res = await agent()
      .post("/api/v1/packages")
      .set(authHeader(sender))
      .send(samplePackageBody({ pickupCity: "Stockholm" }));

    expect(res.status).toBe(400);
  });

  it("does NOT let one sender read another sender's package by id (IDOR fix)", async () => {
    const senderA = await createUser("sender");
    const senderB = await createUser("sender");

    const created = await agent()
      .post("/api/v1/packages")
      .set(authHeader(senderA))
      .send(samplePackageBody());
    const id = created.body.data._id;

    const asB = await agent()
      .get(`/api/v1/packages/${id}`)
      .set(authHeader(senderB));
    expect(asB.status).toBe(403);

    const asA = await agent()
      .get(`/api/v1/packages/${id}`)
      .set(authHeader(senderA));
    expect(asA.status).toBe(200);
  });

  it("scopes the list so a sender only sees their own packages", async () => {
    const senderA = await createUser("sender");
    const senderB = await createUser("sender");

    await agent()
      .post("/api/v1/packages")
      .set(authHeader(senderA))
      .send(samplePackageBody());

    const listB = await agent()
      .get("/api/v1/packages")
      .set(authHeader(senderB));
    expect(listB.status).toBe(200);
    expect(listB.body.count).toBe(0);

    const listA = await agent()
      .get("/api/v1/packages")
      .set(authHeader(senderA));
    expect(listA.body.count).toBe(1);
  });

  it("lets the recipient see a package addressed to their email", async () => {
    const sender = await createUser("sender");
    const recipient = await createUser("recipient", {
      email: "rcpt@example.com",
    });

    await agent()
      .post("/api/v1/packages")
      .set(authHeader(sender))
      .send(samplePackageBody({ recipientEmail: "rcpt@example.com" }));

    const list = await agent()
      .get("/api/v1/packages")
      .set(authHeader(recipient));
    expect(list.body.count).toBe(1);
  });

  it("requires authentication to list packages", async () => {
    const res = await agent().get("/api/v1/packages");
    expect(res.status).toBe(401);
  });
});
