import { describe, it, expect } from "vitest";
import { agent, authHeader, createUser, TEST_PASSWORD } from "./helpers";

describe("auth — registration security", () => {
  it("registers a sender and returns the created user", async () => {
    const res = await agent()
      .post("/api/v1/auth/register")
      .send({
        fullName: "Sender One",
        email: "sender1@example.com",
        password: "password123",
        role: "sender",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("sender");
    expect(res.body.data).not.toHaveProperty("password");
  });

  it("defaults role to sender when none is provided", async () => {
    const res = await agent()
      .post("/api/v1/auth/register")
      .send({
        fullName: "No Role",
        email: "norole@example.com",
        password: "password123",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("sender");
  });

  it("REJECTS carrier self-registration (carrier now requires admin approval)", async () => {
    const res = await agent()
      .post("/api/v1/auth/register")
      .send({
        fullName: "Carrier One",
        email: "carrier1@example.com",
        password: "password123",
        role: "carrier",
      });

    expect(res.status).toBe(400);
  });

  it("lets an admin create a carrier via POST /users, but blocks non-admins", async () => {
    const admin = await createUser("admin");

    const created = await agent()
      .post("/api/v1/users")
      .set(authHeader(admin))
      .send({
        fullName: "Approved Carrier",
        email: "approved-carrier@example.com",
        password: "password123",
        role: "carrier",
      });
    expect(created.status).toBe(201);
    expect(created.body.role).toBe("carrier");

    // A sender cannot create users.
    const sender = await createUser("sender");
    const forbidden = await agent()
      .post("/api/v1/users")
      .set(authHeader(sender))
      .send({
        fullName: "X",
        email: "x@example.com",
        password: "password123",
        role: "carrier",
      });
    expect(forbidden.status).toBe(403);
  });

  it("REJECTS attempts to self-register as admin (privilege escalation fix)", async () => {
    const res = await agent()
      .post("/api/v1/auth/register")
      .send({
        fullName: "Evil Admin",
        email: "evil@example.com",
        password: "password123",
        role: "admin",
      });

    expect(res.status).toBe(400);
  });

  it("rejects duplicate emails with 409", async () => {
    await createUser("sender", { email: "dupe@example.com" });
    const res = await agent()
      .post("/api/v1/auth/register")
      .send({
        fullName: "Dupe",
        email: "dupe@example.com",
        password: "password123",
        role: "sender",
      });
    expect(res.status).toBe(409);
  });

  it("logs in with valid credentials and rejects bad ones", async () => {
    const user = await createUser("sender", { email: "login@example.com" });

    const ok = await agent()
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: TEST_PASSWORD });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();

    const bad = await agent()
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "wrong" });
    expect(bad.status).toBe(401);
    // No raw error object leaked.
    expect(bad.body).not.toHaveProperty("error");
  });
});
