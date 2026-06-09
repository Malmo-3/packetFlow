/**
 * Deliveries API client.
 *
 * A **Delivery** is the operational record that links a Package to a Trip (and
 * therefore a carrier). Created by an admin when assigning a carrier; inherits
 * all shipment details from the parent Package.
 *
 * Endpoints:
 * - `GET    /api/v1/deliveries`                  → list all (optional `?tripId=`)
 * - `POST   /api/v1/deliveries`                  → create (admin)
 * - `GET    /api/v1/deliveries/:id`              → fetch one
 * - `PATCH  /api/v1/deliveries/:id`              → update (admin)
 * - `DELETE /api/v1/deliveries/:id`              → delete (admin)
 * - `PATCH  /api/v1/deliveries/:id/assign-trip`  → assign a trip to one delivery
 * - `GET    /api/v1/deliveries/unassigned`        → deliveries with no trip yet
 */

import { request } from "./client";
import type { BackendPackage } from "./packages";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

/** Current lifecycle state of a delivery. */
export type DeliveryStatus =
  | "pending"     // created but no trip assigned yet
  | "assigned"    // trip (and carrier) assigned
  | "in_transit"  // carrier is transporting the package
  | "delivered"   // package picked up by recipient
  | "cancelled";

/**
 * A delivery record as returned by the backend.
 * The `package` and `trip` fields may be populated objects or raw ObjectId
 * strings depending on the endpoint.
 */
export interface BackendDelivery {
  _id: string;
  /** Populated {@link BackendPackage} or raw ObjectId string. */
  package: BackendPackage | string;
  trackingNumber: string;
  senderName: string;
  recipientName: string;
  recipientEmail: string;
  pickupCity: string;
  destinationCity: string;
  dropOffPoint: string;
  /** Populated trip object or raw ObjectId string; absent when unassigned. */
  trip?: Record<string, unknown> | string;
  status: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a delivery. A trip may be assigned in the same request. */
export interface CreateDeliveryInput {
  /** MongoDB `_id` of the package this delivery covers. */
  packageId: string;
  /** Optionally assign to a trip immediately — sets status to `"assigned"`. */
  trip?: string;
}

/** Fields that can be patched on an existing delivery. */
export type UpdateDeliveryInput = Partial<{
  status: DeliveryStatus;
  /** Reassign to a different trip. */
  trip: string;
}>;

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * List deliveries. Pass `filters.tripId` to scope to a specific trip.
 * Requires admin or carrier role.
 */
export async function listDeliveries(
  filters?: { tripId?: string },
  signal?: AbortSignal,
): Promise<BackendDelivery[]> {
  const query = filters?.tripId ? `?tripId=${encodeURIComponent(filters.tripId)}` : "";
  return request<BackendDelivery[]>(`/deliveries${query}`, { signal });
}

/** Fetch a single delivery by its MongoDB `_id`. */
export async function getDeliveryById(
  id: string,
  signal?: AbortSignal,
): Promise<BackendDelivery> {
  return request<BackendDelivery>(`/deliveries/${encodeURIComponent(id)}`, { signal });
}

/**
 * Create a delivery for a package. Admin only.
 * All shipment details are inherited from the package on the server side.
 * Passing `trip` assigns a carrier in the same request.
 *
 * @throws {ApiError} 409 if the package already has a delivery assigned.
 */
export async function createDelivery(
  input: CreateDeliveryInput,
): Promise<BackendDelivery> {
  return request<BackendDelivery>("/deliveries", {
    method: "POST",
    body: input as unknown as Record<string, unknown>,
  });
}

/** Update delivery fields. Admin only. */
export async function updateDelivery(
  id: string,
  patch: UpdateDeliveryInput,
): Promise<BackendDelivery> {
  return request<BackendDelivery>(`/deliveries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: patch as unknown as Record<string, unknown>,
  });
}

/** Delete a delivery. Admin only. */
export async function deleteDelivery(id: string): Promise<void> {
  await request(`/deliveries/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Assign a single delivery to a trip. Admin only.
 * Bumps delivery status to `"assigned"`.
 */
export async function assignTripToDelivery(
  deliveryId: string,
  tripId: string,
): Promise<BackendDelivery> {
  return request<BackendDelivery>(
    `/deliveries/${encodeURIComponent(deliveryId)}/assign-trip`,
    { method: "PATCH", body: { tripId } },
  );
}

/**
 * List deliveries that have no trip and are still `"pending"`.
 * Used by the admin assignment UI to surface work that needs routing.
 */
export async function listUnassignedDeliveries(
  signal?: AbortSignal,
): Promise<BackendDelivery[]> {
  return request<BackendDelivery[]>("/deliveries/unassigned", { signal });
}
