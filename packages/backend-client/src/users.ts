/**
 * Users API client. Admin read-only operations.
 *
 * Endpoints:
 * - `GET /api/v1/users`          → list all users (admin)
 * - `GET /api/v1/users?role=X`   → list users filtered by role (admin)
 */

import { request } from "./client";

/** All valid user roles. */
export type UserRole = "admin" | "carrier" | "sender" | "recipient";

/** A user record as returned by the backend. */
export interface BackendUser {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  /** Unique public carrier id (e.g. `CR-7QF3K9PA`) — present for carriers. */
  carrierId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * List users. Admin only.
 * Pass `role` to filter — e.g. `"carrier"` to populate the carrier assignment dropdown.
 */
export async function listUsers(
  role?: UserRole,
  signal?: AbortSignal,
): Promise<BackendUser[]> {
  const qs = role ? `?role=${encodeURIComponent(role)}` : "";
  return request<BackendUser[]>(`/users${qs}`, { signal });
}
