import { Card } from "@/components/ui/card";
import { useMyTrips, useUpdateTripStatus } from "@/api/hooks/useTrips";
import { toast } from "@/hooks/use-toast";
import type { TripStatus } from "@packetflow/api-client";

const STATUS_COLOURS: Record<TripStatus, string> = {
  planned: "bg-secondary text-secondary-foreground border-border",
  active: "bg-secondary text-foreground border-border",
  completed: "bg-green-500/10 text-green-600 border-green-500/40",
};

const STATUS_LABELS: Record<TripStatus, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
};

// The only valid forward transitions for a carrier
const NEXT_STATUS: Partial<Record<TripStatus, TripStatus>> = {
  planned: "active",
  active: "completed",
};

function TripStatusBadge({ status }: { status: TripStatus }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLOURS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function CarrierRoutes() {
  const { data: myTrips = [], isLoading } = useMyTrips();
  const updateStatus = useUpdateTripStatus();

  const advance = async (id: string, next: TripStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status: next });
      toast({ title: `Trip marked as ${STATUS_LABELS[next]}` });
    } catch {
      toast({ title: "Failed to update trip status", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">My trips</h1>
        <p className="mt-1 text-muted-foreground">
          Trips assigned to you by the admin.
        </p>
      </header>

      {isLoading ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">
          Loading trips…
        </Card>
      ) : myTrips.length === 0 ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">
          No trips assigned yet. Check back later.
        </Card>
      ) : (
        <div className="space-y-4">
          {myTrips.map((trip) => {
            const next = NEXT_STATUS[trip.status];
            return (
              <Card key={trip._id} className="border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">{trip.name}</h2>
                  <TripStatusBadge status={trip.status} />
                  <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs">
                    {trip.region}
                  </span>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {trip.startCity} → {trip.endCity}
                </p>

                {trip.stops.length > 0 && (
                  <ol className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {trip.stops.map((stop, i) => (
                      <li key={i} className="inline-flex items-center gap-2">
                        <span className="rounded-full border border-border bg-secondary px-2 py-0.5">
                          {stop}
                        </span>
                        {i < trip.stops.length - 1 && <span>→</span>}
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(trip.createdAt).toLocaleDateString()}
                  </p>

                  {next && (
                    <button
                      onClick={() => advance(trip._id, next)}
                      disabled={updateStatus.isPending}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      Mark as {STATUS_LABELS[next]}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
