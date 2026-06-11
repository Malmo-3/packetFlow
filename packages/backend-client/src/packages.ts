/**
 * Packages API client.
 *
 * Endpoints:
 * - `POST   /api/v1/packages`             → create a new package (sender or unauthenticated)
 * - `GET    /api/v1/packages`             → list packages (filtered by role server-side)
 * - `GET    /api/v1/packages/:id`         → fetch a single package
 * - `PATCH  /api/v1/packages/:id`         → update status or fields (admin / carrier)
 * - `DELETE /api/v1/packages/:id`         → admin only
 * - `POST   /api/v1/packages/:id/arrive`  → carrier marks arrival at drop-off point
 * - `POST   /api/v1/packages/:id/pickup`  → carrier marks package as picked up
 *
 * Note: the backend wraps all responses in `{ success, data }` (or `{ success, count, data }`
 * for lists). The functions below unwrap to return the inner `data` directly.
 */

import { request } from "./client";
import type { BackendTrip } from "./trips";

// ---------------------------------------------------------------------------
// Backend response wrappers
// ---------------------------------------------------------------------------

interface WrappedSingle<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface WrappedList<T> {
  success: boolean;
  count: number;
  data: T[];
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

/**
 * A package record as returned by the backend.
 */
export interface BackendPackage {
  _id: string;
  /** Auto-generated `PKT-XXXXXXXX` code used for public tracking. */
  trackingNumber: string;
  senderId?: string;
  senderName: string;
  recipientName: string;
  /** Required — used for in-app notifications when the package arrives or is picked up. */
  recipientEmail: string;
  recipientPhone?: string;
  recipientAddress?: string;
  /** Origin city — must be a valid Skåne municipality. */
  pickupCity: string;
  /** Destination city — must be a valid Skåne municipality. */
  destinationCity: string;
  /** Origin depot — where the **sender** leaves the package. Resolved server-side. */
  dropOffPoint: string;
  /** Destination depot — where the **recipient** collects the package. Resolved server-side. */
  pickUpPoint: string;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  /** ObjectId of the linked delivery document, once a carrier has been assigned. */
  delivery?: string;
  status:
    | "registered"
    | "assigned"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "exception";
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a new package.
 * `dropOffPoint` and `pickUpPoint` are resolved server-side — never send them.
 */
export interface CreatePackageInput {
  senderName: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  recipientAddress?: string;
  pickupCity: string;
  destinationCity: string;
  weight: number;
  dimensions: { length: number; width: number; height: number };
}

/** Partial update — carriers may only set `status` (forward-only); admins can change any field. */
export type UpdatePackageInput = Partial<CreatePackageInput & { status: BackendPackage["status"] }>;

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Create a new package. May be called without authentication (public intake form)
 * or while authenticated as a sender.
 */
export async function createPackage(input: CreatePackageInput): Promise<BackendPackage> {
  const res = await request<WrappedSingle<BackendPackage>>("/packages", {
    method: "POST",
    body: input as unknown as Record<string, unknown>,
  });
  return res.data;
}

/**
 * List packages. Results are filtered server-side by role:
 * - **sender** — own packages only
 * - **carrier** — packages on their active trips
 * - **admin / recipient** — all packages
 */
export async function listPackages(signal?: AbortSignal): Promise<BackendPackage[]> {
  const res = await request<WrappedList<BackendPackage>>("/packages", { signal });
  return res.data;
}

/** Fetch a single package by its MongoDB `_id`. */
export async function getPackageById(id: string, signal?: AbortSignal): Promise<BackendPackage> {
  const res = await request<WrappedSingle<BackendPackage>>(`/packages/${encodeURIComponent(id)}`, { signal });
  return res.data;
}

/**
 * Fetch the trip a package is travelling on (resolved via its delivery).
 * Returns `null` if the package has not been assigned to a trip yet.
 */
export async function getPackageTrip(id: string, signal?: AbortSignal): Promise<BackendTrip | null> {
  const res = await request<WrappedSingle<BackendTrip | null>>(
    `/packages/${encodeURIComponent(id)}/trip`,
    { signal },
  );
  return res.data;
}

/** Update package fields. Carriers may only advance `status`; admins may change any field. */
export async function updatePackage(
  id: string,
  patch: UpdatePackageInput,
): Promise<BackendPackage> {
  const res = await request<WrappedSingle<BackendPackage>>(`/packages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: patch as unknown as Record<string, unknown>,
  });
  return res.data;
}

/** Delete a package. Admin only. */
export async function deletePackage(id: string): Promise<void> {
  await request(`/packages/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Carrier action: mark a package as arrived at its drop-off point.
 * Transitions status `in_transit` → `out_for_delivery` and sends in-app
 * notifications to both the sender and the recipient.
 */
export async function arriveAtDropOff(id: string): Promise<BackendPackage> {
  const res = await request<WrappedSingle<BackendPackage>>(
    `/packages/${encodeURIComponent(id)}/arrive`,
    { method: "POST" },
  );
  return res.data;
}

/**
 * Carrier action: mark a package as picked up by the recipient.
 * Transitions status `out_for_delivery` → `delivered` and notifies the sender.
 */
export async function markPickedUp(id: string): Promise<BackendPackage> {
  const res = await request<WrappedSingle<BackendPackage>>(
    `/packages/${encodeURIComponent(id)}/pickup`,
    { method: "POST" },
  );
  return res.data;
}
