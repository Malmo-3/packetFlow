/**
 * Trips API client.
 *
 * A **Trip** is a named route driven by a carrier. It groups one or more
 * deliveries together and tracks the carrier's progress through Skåne.
 *
 * Endpoints:
 * - `GET    /api/v1/trips`                   → list all trips
 * - `POST   /api/v1/trips`                   → create (admin)
 * - `GET    /api/v1/trips/my`                → carrier's own trips
 * - `GET    /api/v1/trips/:id`               → fetch one
 * - `PATCH  /api/v1/trips/:id`               → update (admin)
 * - `DELETE /api/v1/trips/:id`               → delete (admin)
 * - `PATCH  /api/v1/trips/:id/status`        → advance status (carrier)
 * - `GET    /api/v1/trips/:id/deliveries`    → deliveries on this trip
 * - `PATCH  /api/v1/trips/:id/deliveries`    → bulk-assign deliveries (admin)
 */

import { request } from "./client";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

/**
 * Trip lifecycle — transitions are strictly forward:
 * `planned` → `active` → `completed`
 */
export type TripStatus = "planned" | "active" | "completed";

/** A trip record as returned by the backend. */
export interface BackendTrip {
  _id: string;
  name: string;
  /** Always `"Skåne"` for this application. */
  region: string;
  startCity: string;
  endCity: string;
  /** Intermediate stops between start and end city. */
  stops: string[];
  /** ObjectId of the assigned carrier user; absent if unassigned. */
  assignedCarrier?: string;
  status: TripStatus;
  /** Carrier has acknowledged/accepted the assignment (before starting). */
  accepted?: boolean;
  /** Index into the journey `[startCity, ...stops, endCity]` — the carrier's current position. */
  currentStopIndex?: number;
  /** The assigned carrier's public id (e.g. `CR-7QF3K9PA`); included by some endpoints. */
  assignedCarrierCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a new trip. */
export interface CreateTripInput {
  name: string;
  startCity: string;
  endCity: string;
  /** Defaults to `"Skåne"` on the server if omitted. */
  region?: string;
  stops?: string[];
  /** ObjectId of the carrier to assign immediately. */
  assignedCarrier?: string;
  status?: TripStatus;
}

/** Partial update — all fields are optional. */
export type UpdateTripInput = Partial<CreateTripInput>;

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** List all trips. Visible to all authenticated users. */
export async function listTrips(signal?: AbortSignal): Promise<BackendTrip[]> {
  return request<BackendTrip[]>("/trips", { signal });
}

/** Fetch a single trip by its MongoDB `_id`. */
export async function getTripById(id: string, signal?: AbortSignal): Promise<BackendTrip> {
  return request<BackendTrip>(`/trips/${encodeURIComponent(id)}`, { signal });
}

/**
 * Create a new trip. Admin only.
 * City fields (`startCity`, `endCity`, `stops`) must be valid Skåne municipalities.
 */
export async function createTrip(input: CreateTripInput): Promise<BackendTrip> {
  return request<BackendTrip>("/trips", {
    method: "POST",
    body: input as unknown as Record<string, unknown>,
  });
}

/** Update trip fields. Admin only. */
export async function updateTrip(
  id: string,
  patch: UpdateTripInput,
): Promise<BackendTrip> {
  return request<BackendTrip>(`/trips/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: patch as unknown as Record<string, unknown>,
  });
}

/** Delete a trip. Admin only. */
export async function deleteTrip(id: string): Promise<void> {
  await request(`/trips/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Fetch the deliveries assigned to a specific trip. */
export async function getDeliveriesForTrip(
  tripId: string,
  signal?: AbortSignal,
): Promise<unknown[]> {
  return request<unknown[]>(
    `/trips/${encodeURIComponent(tripId)}/deliveries`,
    { signal },
  );
}

/**
 * Bulk-assign a list of deliveries to a trip. Admin only.
 * Returns match and modification counts.
 */
export async function assignDeliveriesToTrip(
  tripId: string,
  deliveryIds: string[],
): Promise<{ matchedCount: number; modifiedCount: number }> {
  return request(`/trips/${encodeURIComponent(tripId)}/deliveries`, {
    method: "PATCH",
    body: { deliveryIds },
  });
}

/**
 * Carrier-scoped: fetch only the trips assigned to the calling carrier.
 * Uses `GET /trips/my` — the `/my` segment must be registered before `/:id`
 * in the router to avoid being captured as a param.
 */
export async function listMyTrips(signal?: AbortSignal): Promise<BackendTrip[]> {
  return request<BackendTrip[]>("/trips/my", { signal });
}

/**
 * Carrier action: advance a trip's status forward.
 * `planned` → `active` → `completed` (no backwards transitions allowed).
 *
 * @throws {ApiError} 403 if the calling carrier is not assigned to this trip.
 * @throws {ApiError} 400 if the requested status is not a valid forward step.
 */
export async function updateTripStatus(
  id: string,
  status: TripStatus,
): Promise<BackendTrip> {
  return request<BackendTrip>(`/trips/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status },
  });
}
