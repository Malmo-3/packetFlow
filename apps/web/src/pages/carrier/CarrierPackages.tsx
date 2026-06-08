import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  usePackages,
  useArriveAtDropOff,
  useMarkPickedUp,
} from "@/api/hooks/usePackages";
import { toast } from "@/hooks/use-toast";
import type { PackageStatus } from "@packetflow/types";
import type { PackageView } from "@/api/packages";

export default function CarrierPackages() {
  const { data: packages = [], isLoading } = usePackages();
  const arriveAction = useArriveAtDropOff();
  const pickupAction = useMarkPickedUp();
  const [q, setQ] = useState("");

  const filtered = (packages as PackageView[]).filter(
    (p) =>
      q.length === 0 ||
      (p.trackingCode ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (p.recipientName ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  const handleArrive = async (pkgId: string, trackingCode: string) => {
    try {
      await arriveAction.mutateAsync(pkgId);
      toast({ title: "Arrival registered", description: `${trackingCode} — sender and recipient notified` });
    } catch {
      toast({ title: "Failed to register arrival", variant: "destructive" });
    }
  };

  const handlePickup = async (pkgId: string, trackingCode: string) => {
    try {
      await pickupAction.mutateAsync(pkgId);
      toast({ title: "Package picked up", description: `${trackingCode} — sender notified` });
    } catch {
      toast({ title: "Failed to mark as picked up", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My deliveries</h1>
          <p className="mt-1 text-muted-foreground">
            {packages.length} package{packages.length !== 1 ? "s" : ""} assigned to your fleet.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search code or recipient"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>

      {isLoading ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">Loading deliveries...</Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">
          {q ? "No packages match your search." : "No packages assigned yet."}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const pkg = p as PackageView;
            const status = p.status as PackageStatus;
            const canArrive = status === "in_transit";
            const canPickup = status === "out_for_delivery";

            return (
              <Card key={p.id} className="border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Package info */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">{p.trackingCode}</span>
                      <StatusBadge status={status} />
                    </div>
                    <p className="text-sm font-medium">{p.recipientName}</p>
                    <p className="text-xs text-muted-foreground">{pkg.recipientEmail}</p>
                    {pkg.dropOffPoint && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Drop-off:</span> {pkg.dropOffPoint}
                      </p>
                    )}
                    {pkg.pickupCity && pkg.destinationCity && (
                      <p className="text-xs text-muted-foreground">
                        {pkg.pickupCity} → {pkg.destinationCity}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    {canArrive && (
                      <Button
                        size="sm"
                        onClick={() => handleArrive(p.id, p.trackingCode)}
                        disabled={arriveAction.isPending}
                        className="w-full sm:w-auto"
                      >
                        Arrived at drop-off
                      </Button>
                    )}
                    {canPickup && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePickup(p.id, p.trackingCode)}
                        disabled={pickupAction.isPending}
                        className="w-full sm:w-auto"
                      >
                        Mark as picked up
                      </Button>
                    )}
                    {status === "delivered" && (
                      <span className="text-xs text-green-600 font-medium">✓ Delivered</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
