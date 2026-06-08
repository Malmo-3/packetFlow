import { MapPin } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { Scan } from "@packetflow/types";

export function ScanTimeline({ scans }: { scans: Scan[] }) {
  if (scans.length === 0) {
    return (
      <div className="rounded-xl bg-muted p-8 text-center text-sm text-muted-foreground">
        No scans recorded yet. The package is registered and waiting for first checkpoint.
      </div>
    );
  }

  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {scans.map((scan, i) => (
        <li key={scan.id} className="relative animate-fade-in">
          <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card">
            <span className="h-2 w-2 rounded-full bg-foreground" />
          </span>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {scan.checkpointName}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(scan.timestamp).toLocaleString()} ·{" "}
                <span className="font-mono">
                  {scan.lat.toFixed(4)}, {scan.lng.toFixed(4)}
                </span>
              </div>
              {scan.note && <p className="mt-1 text-sm text-muted-foreground">{scan.note}</p>}
            </div>
            <StatusBadge status={scan.status} />
          </div>
          {i === scans.length - 1 && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-foreground" />
              Latest update
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
