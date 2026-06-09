/**
 * Scans API — wired to the backend scan history.
 *
 *   GET  /api/v1/scans/package/:packageId  -> { data: { history: BackendScan[] } }
 *   POST /api/v1/scans                      body: backend scan  (admin/carrier)
 *
 * The package-scoped history read is available to any authenticated user (so a
 * recipient can see their own timeline). Backend `ScanRecord` is mapped to the
 * app's `Scan` shape.
 */

import { request } from "@packetflow/backend-client";
import type { PackageStatus, Scan } from "@packetflow/types";

export interface CreateScanInput {
  packageId: string;
  checkpointId?: string;
  checkpointName: string;
  lat: number;
  lng: number;
  status: PackageStatus;
  note?: string;
}

interface BackendScan {
  _id: string;
  package: string | { _id: string };
  checkpoint?: string | { _id: string; name?: string };
  latitude?: number;
  longitude?: number;
  packageStatusAfter: PackageStatus;
  scannedAt: string;
}

interface HistoryResponse {
  data: { history: BackendScan[] };
}

const idOf = (v: string | { _id: string } | undefined): string | undefined =>
  v == null ? undefined : typeof v === "string" ? v : v._id;

const toScan = (s: BackendScan): Scan => ({
  id: s._id,
  packageId: idOf(s.package) ?? "",
  checkpointId: idOf(s.checkpoint),
  checkpointName:
    s.checkpoint && typeof s.checkpoint === "object"
      ? s.checkpoint.name ?? ""
      : "",
  lat: s.latitude ?? 0,
  lng: s.longitude ?? 0,
  timestamp: s.scannedAt,
  status: s.packageStatusAfter,
});

export async function listScansForPackage(packageId: string): Promise<Scan[]> {
  const res = await request<HistoryResponse>(
    `/scans/package/${encodeURIComponent(packageId)}`,
  );
  return (res.data.history ?? []).map(toScan);
}

export async function createScan(input: CreateScanInput): Promise<Scan> {
  const res = await request<{ data: BackendScan }>("/scans", {
    method: "POST",
    body: {
      package: input.packageId,
      checkpoint: input.checkpointId,
      scanCode: input.checkpointName,
      packageStatusAfter: input.status,
      latitude: input.lat,
      longitude: input.lng,
    },
  });
  return toScan(res.data);
}
