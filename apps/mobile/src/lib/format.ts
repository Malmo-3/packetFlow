import type { PackageStatus } from "@packetflow/types";

/** Maps a package status to a 0–100 progress value (mirrors web lib/utils). */
export function progressForStatus(status: PackageStatus): number {
  switch (status) {
    case "registered":
      return 15;
    case "in_transit":
      return 50;
    case "out_for_delivery":
      return 80;
    case "delivered":
      return 100;
    case "exception":
      return 50;
    default:
      return 0;
  }
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
