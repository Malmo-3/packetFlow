/**
 * Packages API layer for mobile — mirrors apps/web/src/features/packages/packagesApi.ts.
 * Maps backend DTOs to the richer `PackageView` shape used across the app.
 */
import {
  packagesApi,
  type BackendPackage,
  type BackendTrip,
  type CreatePackageInput,
  type UpdatePackageInput,
} from "@packetflow/backend-client";
import type { Package, PackageStatus } from "@packetflow/types";

export type { CreatePackageInput, UpdatePackageInput };

const VALID_STATUSES: PackageStatus[] = [
  "registered",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
];

function normaliseStatus(value: string): PackageStatus {
  const map: Record<string, PackageStatus> = {
    registered: "registered",
    assigned: "registered",
    in_transit: "in_transit",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
    exception: "exception",
  };
  return map[value] ?? ((VALID_STATUSES as string[]).includes(value) ? (value as PackageStatus) : "registered");
}

export interface PackageView extends Package {
  senderName: string;
  pickupCity: string;
  destinationCity: string;
  dropOffPoint: string;
  recipientEmail: string;
  recipientPhone?: string;
}

export function fromBackend(dto: BackendPackage): PackageView {
  return {
    id: dto._id,
    trackingCode: dto.trackingNumber,
    senderId: dto.senderId ?? "",
    recipientId: "",
    recipientName: dto.recipientName,
    recipientAddress: dto.recipientAddress ?? "",
    weightKg: dto.weight,
    dimensions: dto.dimensions,
    status: normaliseStatus(dto.status),
    createdAt: dto.createdAt,
    notes: undefined,
    routeId: undefined,
    carrierId: undefined,
    estimatedDelivery: undefined,
    senderName: dto.senderName,
    pickupCity: dto.pickupCity,
    destinationCity: dto.destinationCity,
    dropOffPoint: dto.dropOffPoint,
    recipientEmail: dto.recipientEmail,
    recipientPhone: dto.recipientPhone,
  };
}

export async function listPackages(signal?: AbortSignal): Promise<PackageView[]> {
  const items = await packagesApi.listPackages(signal);
  return items.map(fromBackend);
}

export async function getPackageById(id: string, signal?: AbortSignal): Promise<PackageView> {
  const dto = await packagesApi.getPackageById(id, signal);
  return fromBackend(dto);
}

/**
 * Canonicalise a tracking code for tolerant comparison: upper-case, strip any
 * non-alphanumerics (spaces, dashes), and drop an optional leading "PKT" prefix.
 * This lets "PKT-G87MV4S1", "pkt g87mv4s1" and bare "g87mv4s1" all match.
 */
function canonicalCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^PKT/, "");
}

export async function getPackageByCode(code: string, signal?: AbortSignal): Promise<PackageView | undefined> {
  const target = canonicalCode(code);
  if (!target) return undefined;
  const all = await listPackages(signal);
  return all.find((p) => canonicalCode(p.trackingCode) === target);
}

export async function createPackage(input: CreatePackageInput): Promise<PackageView> {
  const dto = await packagesApi.createPackage(input);
  return fromBackend(dto);
}

/** The trip (stops + currentStopIndex) a package is on, or null if unassigned. */
export async function getPackageTrip(id: string, signal?: AbortSignal): Promise<BackendTrip | null> {
  return packagesApi.getPackageTrip(id, signal);
}
