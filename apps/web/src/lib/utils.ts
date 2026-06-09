import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Package, PackageStatus } from "@packetflow/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Maps a package status to a 0–100 progress value for UI progress bars.
 * `exception` shares the same position as `in_transit` (50) since it can
 * occur at any point in the journey.
 */
export function progressForStatus(status: PackageStatus): number {
  switch (status) {
    case "registered":       return 15;
    case "in_transit":       return 50;
    case "out_for_delivery": return 80;
    case "delivered":        return 100;
    case "exception":        return 50;
  }
}

/** Returns the server-provided ETA for a package, or undefined if unavailable. */
export function estimateDelivery(pkg: Package): string | undefined {
  return pkg.estimatedDelivery ?? undefined;
}
