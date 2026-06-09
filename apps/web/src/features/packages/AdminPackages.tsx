import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "./StatusBadge";
import { toast } from "@/hooks/use-toast";
import { usePackages } from "./usePackages";
import { useCreateDelivery, useAssignTripToDelivery } from "@/hooks/useDeliveries";
import { useTrips, useCarrierUsers } from "@/hooks/useTrips";
import type { PackageView } from "./packagesApi";
import type { BackendTrip } from "@packetflow/backend-client";

// ---------------------------------------------------------------------------
// Assign-carrier dialog
// ---------------------------------------------------------------------------

function AssignDialog({
  pkg,
  trips,
  carriers,
  onClose,
}: {
  pkg: PackageView;
  trips: BackendTrip[];
  carriers: { _id: string; fullName: string; email: string }[];
  onClose: () => void;
}) {
  const [tripId, setTripId] = useState("");
  const createDelivery = useCreateDelivery();
  const assignTrip = useAssignTripToDelivery();

  const eligibleTrips = trips.filter((t) => t.status !== "completed");

  const carrierName = (id?: string) => {
    if (!id) return "Unassigned";
    return carriers.find((c) => c._id === id)?.fullName ?? "Unknown";
  };

  const handleAssign = async () => {
    if (!tripId) {
      toast({ title: "Select a trip first", variant: "destructive" });
      return;
    }

    try {
      if (!pkg.id.includes("-") && pkg.id.length === 24) {
        // Package has no delivery yet — create one and immediately assign to trip
        const delivery = await createDelivery.mutateAsync({ packageId: pkg.id, trip: tripId });
        // createDelivery already stamps the tripId if passed, so we're done.
        // But if the backend ignores it, fall back to assignTrip:
        if (!delivery.trip) {
          await assignTrip.mutateAsync({ deliveryId: delivery._id, tripId });
        }
      }
      toast({ title: "Carrier assigned", description: `Package routed to trip.` });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign carrier";
      toast({ title: message, variant: "destructive" });
    }
  };

  const isPending = createDelivery.isPending || assignTrip.isPending;

  return (
    <div className="space-y-4 pt-2">
      <div className="rounded-md border border-border bg-secondary/30 px-4 py-3 text-sm space-y-1">
        <p><span className="text-muted-foreground">Package:</span> <span className="font-mono">{pkg.trackingCode}</span></p>
        <p><span className="text-muted-foreground">Recipient:</span> {pkg.recipientName}</p>
        <p><span className="text-muted-foreground">Route:</span> {pkg.pickupCity} → {pkg.destinationCity}</p>
      </div>

      <div className="space-y-1.5">
        <Label>Assign to trip</Label>
        {eligibleTrips.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active trips available. Create a trip on the Trips page first.
          </p>
        ) : (
          <Select value={tripId} onValueChange={setTripId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a trip…" />
            </SelectTrigger>
            <SelectContent>
              {eligibleTrips.map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.startCity} → {t.endCity} · Carrier: {carrierName(t.assignedCarrier)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleAssign} disabled={isPending || !tripId}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Assign
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminPackages() {
  const { data: packages = [], isLoading } = usePackages();
  const { data: trips = [] } = useTrips();
  const { data: carriers = [] } = useCarrierUsers();
  const [assignTarget, setAssignTarget] = useState<PackageView | null>(null);

  const unassignedCount = (packages as PackageView[]).filter(
    (p) => p.status === "registered",
  ).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">All packages</h1>
          <p className="mt-1 text-muted-foreground">
            {unassignedCount > 0
              ? `${unassignedCount} package${unassignedCount !== 1 ? "s" : ""} waiting for carrier assignment.`
              : "All packages have been assigned."}
          </p>
        </div>
      </header>

      {isLoading ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">
          Loading packages…
        </Card>
      ) : packages.length === 0 ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">
          No packages yet.
        </Card>
      ) : (
        <Card className="overflow-hidden border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Tracking</th>
                <th className="px-4 py-3 text-left">Sender</th>
                <th className="px-4 py-3 text-left">Recipient</th>
                <th className="px-4 py-3 text-left">Route</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {(packages as PackageView[]).map((p) => {
                const needsAssignment = p.status === "registered";
                return (
                  <tr key={p.id} className="border-t border-border align-middle hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <Link to={`/track/${p.trackingCode}`} className="font-mono hover:underline">
                        {p.trackingCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.senderName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.recipientName || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {(p as PackageView).recipientEmail || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.pickupCity && p.destinationCity
                        ? `${p.pickupCity} → ${p.destinationCity}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      {needsAssignment ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => setAssignTarget(p as PackageView)}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Assign carrier
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Assign-carrier dialog */}
      <Dialog open={Boolean(assignTarget)} onOpenChange={(open) => { if (!open) setAssignTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign carrier</DialogTitle>
          </DialogHeader>
          {assignTarget && (
            <AssignDialog
              pkg={assignTarget}
              trips={trips}
              carriers={carriers as any}
              onClose={() => setAssignTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
