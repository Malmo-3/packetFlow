/**
 * Carrier API client.
 *
 * The carrier workflow: start a shift → accept an assigned trip → start (check
 * in) → advance through the trip's stops (notifies senders/recipients) and scan
 * packages as delivered → end the shift.
 *
 * Endpoints (all require the carrier role):
 * - `GET   /api/v1/carrier/shift`                    → current shift state + assigned trip
 * - `POST  /api/v1/carrier/shift/start`              → clock in
 * - `POST  /api/v1/carrier/shift/end`                → clock out
 * - `GET   /api/v1/carrier/trip`                     → current planned/active trip + deliveries
 * - `GET   /api/v1/carrier/trips/:id/packages`       → packages on a trip
 * - `POST  /api/v1/carrier/trips/:id/accept`         → accept an assigned trip
 * - `PATCH /api/v1/carrier/trips/:id/check-in`       → start the trip (planned → active)
 * - `POST  /api/v1/carrier/trips/:id/advance`        → advance to the next city/stop
 * - `POST  /api/v1/carrier/trips/:id/scans`          → scan a package as delivered
 * - `PATCH /api/v1/carrier/trips/:id/check-out`      → end the trip (active → completed)
 */

import { request } from "./client";
import type { BackendTrip } from "./trips";
import type { BackendPackage } from "./packages";

export interface ShiftState {
  onShift: boolean;
  shiftStartedAt: string | null;
  trip: BackendTrip | null;
}

interface Wrapped<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Current shift status and the carrier's planned/active trip (if any). */
export async function getShift(signal?: AbortSignal): Promise<ShiftState> {
  const res = await request<Wrapped<ShiftState>>("/carrier/shift", { signal });
  return res.data;
}

/** Clock in — begin a shift. */
export async function startShift(): Promise<void> {
  await request("/carrier/shift/start", { method: "POST" });
}

/** Clock out — end the shift (rejected while a trip is still active). */
export async function endShift(): Promise<void> {
  await request("/carrier/shift/end", { method: "POST" });
}

/** Packages assigned to a trip. */
export async function getTripPackages(
  tripId: string,
  signal?: AbortSignal,
): Promise<BackendPackage[]> {
  const res = await request<{ success: boolean; count: number; data: BackendPackage[] }>(
    `/carrier/trips/${encodeURIComponent(tripId)}/packages`,
    { signal },
  );
  return res.data;
}

/** Accept an assigned (planned) trip. */
export async function acceptTrip(tripId: string): Promise<BackendTrip> {
  const res = await request<Wrapped<{ trip: BackendTrip }>>(
    `/carrier/trips/${encodeURIComponent(tripId)}/accept`,
    { method: "POST" },
  );
  return res.data.trip;
}

/** Start the trip (planned → active). */
export async function checkIn(tripId: string): Promise<BackendTrip> {
  const res = await request<Wrapped<{ trip: BackendTrip }>>(
    `/carrier/trips/${encodeURIComponent(tripId)}/check-in`,
    { method: "PATCH" },
  );
  return res.data.trip;
}

export interface AdvanceResult {
  trip: BackendTrip;
  journey: string[];
  currentCity: string;
  currentStopIndex: number;
  atDestination: boolean;
}

/** Advance the carrier to the next city/stop. Notifies senders & recipients. */
export async function advanceTrip(tripId: string): Promise<AdvanceResult> {
  const res = await request<Wrapped<AdvanceResult>>(
    `/carrier/trips/${encodeURIComponent(tripId)}/advance`,
    { method: "POST" },
  );
  return res.data;
}

/** Scan a package on the trip as delivered (validates the tracking code). */
export async function scanPackage(
  tripId: string,
  packageId: string,
  scanCode: string,
): Promise<void> {
  await request(`/carrier/trips/${encodeURIComponent(tripId)}/scans`, {
    method: "POST",
    body: { packageId, scanCode },
  });
}

/** End the trip (active → completed). Rejected while deliveries are unfinished. */
export async function checkOut(tripId: string): Promise<BackendTrip> {
  const res = await request<Wrapped<{ trip: BackendTrip }>>(
    `/carrier/trips/${encodeURIComponent(tripId)}/check-out`,
    { method: "PATCH" },
  );
  return res.data.trip;
}

// ---------------------------------------------------------------------------
// Self-service: profile, history, edit, delete
// ---------------------------------------------------------------------------

export interface CarrierProfile {
  id: string;
  carrierId: string | null;
  fullName: string;
  email: string;
  role: string;
  phone: string | null;
  vehicle: string | null;
}

export interface CarrierHistoryItem {
  trip: BackendTrip;
  totalPackages: number;
  deliveredCount: number;
}

/** The carrier's own account + carrier profile (includes the unique carrier id). */
export async function getMe(signal?: AbortSignal): Promise<CarrierProfile> {
  const res = await request<Wrapped<CarrierProfile>>("/carrier/me", { signal });
  return res.data;
}

/** Past + current trips with delivery counts (session history). */
export async function getHistory(signal?: AbortSignal): Promise<CarrierHistoryItem[]> {
  const res = await request<Wrapped<CarrierHistoryItem[]>>("/carrier/history", { signal });
  return res.data;
}

/** Update the carrier's own name / phone / vehicle. */
export async function updateProfile(input: {
  fullName?: string;
  phone?: string;
  vehicle?: string;
}): Promise<CarrierProfile> {
  const res = await request<Wrapped<CarrierProfile>>("/carrier/profile", {
    method: "PATCH",
    body: input,
  });
  return res.data;
}

/** Delete the carrier's own account. */
export async function deleteAccount(): Promise<void> {
  await request("/carrier/account", { method: "DELETE" });
}
