/**
 * Packages web-API layer.
 *
 * Thin wrapper around `@packetflow/backend-client` that maps backend DTOs to the
 * frontend `Package` / `PackageView` shapes used throughout the UI.
 *
 * Field mapping (backend → frontend):
 * - `trackingNumber` → `trackingCode`
 * - `weight`         → `weightKg`
 *
 * The `PackageView` interface extends `Package` with extra backend fields
 * (senderName, pickupCity, destinationCity, dropOffPoint, recipientEmail)
 * surfaced for admin and carrier views.
 */

import { packagesApi, type BackendPackage, type CreatePackageInput, type UpdatePackageInput } from "@packetflow/backend-client";
import type { Package, PackageStatus } from "@packetflow/types";

export type { CreatePackageInput, UpdatePackageInput };

// ---------------------------------------------------------------------------
// Status normalisation
// ---------------------------------------------------------------------------

const VALID_STATUSES: PackageStatus[] = [
  "registered",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
];

/**
 * Map the backend status enum to the frontend's `PackageStatus` type.
 * `"assigned"` is collapsed to `"registered"` for display purposes — the UI
 * shows a single "waiting for carrier" state rather than exposing the internal
 * assignment state directly.
 */
function normaliseStatus(value: string): PackageStatus {
  // Backend enum: registered | assigned | in_transit | delivered
  const map: Record<string, PackageStatus> = {
    registered: "registered",
    assigned: "registered",
    in_transit: "in_transit",
    delivered: "delivered",
  };
  return map[value] ?? ((VALID_STATUSES as string[]).includes(value) ? (value as PackageStatus) : "registered");
}

// ---------------------------------------------------------------------------
// DTO → frontend shape
// ---------------------------------------------------------------------------

/**
 * Extended package shape used by the web UI.
 * Extends the shared `Package` interface with backend-specific fields
 * (cities, drop-off point, contact details) that the admin and carrier
 * views need but the core domain type doesn't include.
 */
export interface PackageView extends Package {
  senderName: string;
  pickupCity: string;
  destinationCity: string;
  dropOffPoint: string;
  recipientEmail: string;
  recipientPhone?: string;
}

/** Map a raw `BackendPackage` DTO to the richer `PackageView` shape. */
export function fromBackend(dto: BackendPackage): PackageView {
  return {
    id: dto._id,
    trackingCode: dto.trackingNumber,
    senderId: dto.senderId ?? "",
    recipientId: "",
    recipientName: dto.recipientName,
    // recipientAddress stays as the optional home address (may be undefined)
    recipientAddress: dto.recipientAddress ?? "",
    weightKg: dto.weight,
    dimensions: dto.dimensions,
    status: normaliseStatus(dto.status),
    createdAt: dto.createdAt,
    notes: undefined,
    routeId: undefined,
    carrierId: undefined,
    estimatedDelivery: undefined,
    // Extra backend fields surfaced for carrier/admin views
    senderName: dto.senderName,
    pickupCity: dto.pickupCity,
    destinationCity: dto.destinationCity,
    dropOffPoint: dto.dropOffPoint,
    recipientEmail: dto.recipientEmail,
    recipientPhone: dto.recipientPhone,
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** List packages visible to the current user (filtered server-side by role). */
export async function listPackages(signal?: AbortSignal): Promise<PackageView[]> {
  const items = await packagesApi.listPackages(signal);
  return items.map(fromBackend);
}

/** Fetch a single package by its MongoDB `_id`. */
export async function getPackageById(id: string, signal?: AbortSignal): Promise<PackageView> {
  const dto = await packagesApi.getPackageById(id, signal);
  return fromBackend(dto);
}

/**
 * Fetches the full list and finds by tracking code client-side.
 * TODO(backend): replace with GET /api/v1/packages/by-code/:code once that endpoint exists.
 */
export async function getPackageByCode(code: string, signal?: AbortSignal): Promise<PackageView | undefined> {
  const normalised = code.trim().toLowerCase();
  if (!normalised) return undefined;
  const all = await listPackages(signal);
  return all.find((p) => p.trackingCode.toLowerCase() === normalised);
}

export async function createPackage(input: CreatePackageInput): Promise<Package> {
  const dto = await packagesApi.createPackage(input);
  return fromBackend(dto);
}

export async function updatePackage(id: string, patch: UpdatePackageInput): Promise<Package> {
  const dto = await packagesApi.updatePackage(id, patch);
  return fromBackend(dto);
}

export async function deletePackage(id: string): Promise<void> {
  await packagesApi.deletePackage(id);
}

export async function arriveAtDropOff(id: string): Promise<PackageView> {
  const dto = await packagesApi.arriveAtDropOff(id);
  return fromBackend(dto);
}

export async function markPickedUp(id: string): Promise<PackageView> {
  const dto = await packagesApi.markPickedUp(id);
  return fromBackend(dto);
}

/**
 * Kept for call-site compatibility (e.g. BatchImport).
 * @deprecated Side-car is gone — all fields are now persisted server-side.
 */
export function primeSideCar(_id: string, _sideCar: unknown) {
  // no-op: retained so old import sites compile without changes
}
