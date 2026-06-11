/**
 * Scans API for mobile — reads a package's scan history for the tracking timeline.
 * Mirrors apps/web/src/api/scans.ts.
 */
import { request } from "@packetflow/backend-client";
import type { PackageStatus, Scan } from "@packetflow/types";

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
  checkpointName: s.checkpoint && typeof s.checkpoint === "object" ? s.checkpoint.name ?? "" : "",
  lat: s.latitude ?? 0,
  lng: s.longitude ?? 0,
  timestamp: s.scannedAt,
  status: s.packageStatusAfter,
});

export async function listScansForPackage(packageId: string): Promise<Scan[]> {
  const res = await request<HistoryResponse>(`/scans/package/${encodeURIComponent(packageId)}`);
  return (res.data.history ?? []).map(toScan);
}
