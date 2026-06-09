/**
 * Users API — wired to the backend.
 *
 *   GET /api/v1/users            -> BackendUser[]   (admin)
 *   GET /api/v1/users?role=...   -> BackendUser[]   (admin)
 *
 * The backend has no per-id / per-email user endpoints, so those helpers filter
 * the list client-side. Backend `{_id, fullName}` is mapped to the app's
 * `User {id, name}` shape.
 */

import { request } from "@packetflow/backend-client";
import type { Role, User } from "@packetflow/types";

interface BackendUser {
  _id: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
}

const toUser = (u: BackendUser): User => ({
  id: u._id,
  name: u.fullName,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});

export async function listUsers(): Promise<User[]> {
  const users = await request<BackendUser[]>("/users");
  return users.map(toUser);
}

/** Admin-only: delete a user by id. */
export async function deleteUser(id: string): Promise<void> {
  await request(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getUserById(id: string): Promise<User | undefined> {
  return (await listUsers()).find((u) => u.id === id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const target = email.trim().toLowerCase();
  return (await listUsers()).find((u) => u.email.toLowerCase() === target);
}

export async function findRecipientByNameOrEmail(
  query: string,
): Promise<User | undefined> {
  const q = query.trim().toLowerCase();
  const recipients = (await request<BackendUser[]>("/users?role=recipient")).map(
    toUser,
  );
  return recipients.find(
    (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );
}
