/**
 * StatusBadge — pill-shaped status indicator for a package's lifecycle.
 *
 * Uses Tailwind's dark: variants so it reads clearly on both light (white)
 * and dark (near-black) backgrounds without any JS theme logic.
 *
 * - `registered`       → gray
 * - `in_transit`       → blue
 * - `out_for_delivery` → amber
 * - `delivered`        → green
 * - `exception`        → red
 */
import { cn } from "@/lib/utils";
import type { PackageStatus } from "@packetflow/types";

const LABELS: Record<PackageStatus, string> = {
  registered: "Registered",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  exception: "Exception",
};

const STYLES: Record<PackageStatus, string> = {
  registered:
    "border border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300",
  in_transit:
    "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  out_for_delivery:
    "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  delivered:
    "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  exception:
    "border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function StatusBadge({ status, className }: { status: PackageStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  );
}
