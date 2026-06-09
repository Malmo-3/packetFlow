/**
 * Shared test helpers: create users directly and mint JWTs for them, plus a
 * supertest agent bound to the Express app.
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../app";
import User from "../models/user.model";
import type { Role } from "../shared/skane";

export const agent = () => request(app);

export const TEST_PASSWORD = "password123";

export async function createUser(
  role: Role,
  overrides: Partial<{ fullName: string; email: string; password: string }> = {},
) {
  const email = (overrides.email || `${role}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@example.com`).toLowerCase();
  const password = overrides.password || TEST_PASSWORD;
  const hashed = await bcrypt.hash(password, 4);

  const user = await User.create({
    fullName: overrides.fullName || `Test ${role}`,
    email,
    password: hashed,
    role,
  });

  return user;
}

export function tokenFor(user: {
  _id: unknown;
  email: string;
  role: string;
}): string {
  return jwt.sign(
    { userId: String(user._id), email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" },
  );
}

export function authHeader(user: { _id: unknown; email: string; role: string }) {
  return { Authorization: `Bearer ${tokenFor(user)}` };
}

export const samplePackageBody = (overrides: Record<string, unknown> = {}) => ({
  senderName: "Alice Sender",
  recipientName: "Bob Recipient",
  recipientEmail: "bob@example.com",
  pickupCity: "Malmö",
  destinationCity: "Lund",
  weight: 2.5,
  dimensions: { length: 10, width: 10, height: 10 },
  ...overrides,
});
