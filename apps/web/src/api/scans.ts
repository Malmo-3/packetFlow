/**
 * Scans API
 *
 * BACKEND CONTRACT:
 *   GET  /api/v1/packages/:id/scans   -> Scan[]  (ordered by timestamp asc)
 *   POST /api/v1/packages/:id/scans   body: CreateScanInput  -> Scan
 *     Side-effect: updates package status and fires matching webhooks.
 */

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

export async function listScansForPackage(_packageId: string): Promise<Scan[]> {
  throw new Error("TODO: GET /api/v1/packages/:id/scans");
}

export async function createScan(_input: CreateScanInput): Promise<Scan> {
  throw new Error("TODO: POST /api/v1/packages/:id/scans");
}
