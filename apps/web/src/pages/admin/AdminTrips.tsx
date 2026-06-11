import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  useTrips,
  useCreateTrip,
  useUpdateTrip,
  useDeleteTrip,
  useCarrierUsers,
} from "@/hooks/useTrips";
import type { TripStatus } from "@packetflow/backend-client";
import { SKANE_CITIES } from "@packetflow/types";
import type { SkaneCity } from "@packetflow/types";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_COLOURS: Record<TripStatus, string> = {
  planned: "bg-secondary text-secondary-foreground border-border",
  active: "bg-secondary text-foreground border-border",
  completed: "bg-green-500/10 text-green-600 border-green-500/40",
};

function TripStatusBadge({ status }: { status: TripStatus }) {
  const labels: Record<TripStatus, string> = {
    planned: "Planned",
    active: "Active",
    completed: "Completed",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLOURS[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Create-trip dialog
// ---------------------------------------------------------------------------

function CreateTripDialog() {
  const createTrip = useCreateTrip();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [startCity, setStartCity] = useState<SkaneCity | "">("");
  const [endCity, setEndCity] = useState<SkaneCity | "">("");
  const [stops, setStops] = useState<SkaneCity[]>([]);
  const [stopToAdd, setStopToAdd] = useState<SkaneCity | "">("");

  // Auto-generate the trip name from the route until the admin types their own.
  useEffect(() => {
    if (nameEdited) return;
    setName(startCity && endCity ? `${startCity} → ${endCity}` : "");
  }, [startCity, endCity, nameEdited]);

  const reset = () => {
    setName(""); setNameEdited(false); setStartCity(""); setEndCity(""); setStops([]); setStopToAdd("");
  };

  const addStop = (city: SkaneCity) => {
    if (!stops.includes(city)) setStops((prev) => [...prev, city]);
    setStopToAdd("");
  };

  const removeStop = (city: SkaneCity) =>
    setStops((prev) => prev.filter((s) => s !== city));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startCity || !endCity) {
      toast({ title: "Name, start city and end city are required", variant: "destructive" });
      return;
    }
    try {
      await createTrip.mutateAsync({
        name: name.trim(),
        region: "Skåne",
        startCity,
        endCity,
        stops,
      });
      toast({ title: "Trip created" });
      reset();
      setOpen(false);
    } catch {
      toast({ title: "Failed to create trip", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create trip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Trip name — auto-generated from the route, editable */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-name">
              Trip name <span className="text-xs text-muted-foreground">(auto-generated, editable)</span>
            </Label>
            <Input
              id="ct-name"
              placeholder="Select start and end cities…"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameEdited(true);
              }}
            />
          </div>

          {/* Start + End cities */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start city</Label>
              <Select value={startCity} onValueChange={(v) => setStartCity(v as SkaneCity)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city…" />
                </SelectTrigger>
                <SelectContent>
                  {SKANE_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>End city</Label>
              <Select value={endCity} onValueChange={(v) => setEndCity(v as SkaneCity)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city…" />
                </SelectTrigger>
                <SelectContent>
                  {SKANE_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stops — tag-style picker */}
          <div className="space-y-1.5">
            <Label>Stops <span className="text-xs text-muted-foreground">(optional)</span></Label>
            {stops.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {stops.map((city) => (
                  <span
                    key={city}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-xs"
                  >
                    {city}
                    <button
                      type="button"
                      onClick={() => removeStop(city)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Select
              value={stopToAdd}
              onValueChange={(v) => addStop(v as SkaneCity)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add a stop…" />
              </SelectTrigger>
              <SelectContent>
                {SKANE_CITIES.filter((c) => !stops.includes(c) && c !== startCity && c !== endCity).map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTrip.isPending}>
              {createTrip.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

// Sentinel value for the "Unassigned" option — Radix <SelectItem> forbids an
// empty-string value, so we use this token and translate it back to undefined.
const UNASSIGNED = "__unassigned__";

export default function AdminTrips() {
  const { data: trips = [], isLoading } = useTrips();
  const { data: carriers = [] } = useCarrierUsers();
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const assignCarrier = async (tripId: string, carrierId: string) => {
    try {
      await updateTrip.mutateAsync({
        id: tripId,
        patch: { assignedCarrier: carrierId === UNASSIGNED ? undefined : carrierId },
      });
      toast({ title: "Carrier assigned" });
    } catch {
      toast({ title: "Failed to assign carrier", variant: "destructive" });
    }
  };

  const setStatus = async (tripId: string, status: TripStatus) => {
    try {
      await updateTrip.mutateAsync({ id: tripId, patch: { status } });
      toast({ title: "Status updated" });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTrip.mutateAsync(deleteTarget.id);
      toast({ title: "Trip deleted" });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Failed to delete trip", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trips</h1>
          <p className="mt-1 text-muted-foreground">
            Create trips, assign carriers, and track delivery status.
          </p>
        </div>
        <CreateTripDialog />
      </header>

      {isLoading ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">
          Loading trips…
        </Card>
      ) : trips.length === 0 ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">
          No trips yet. Create the first one above.
        </Card>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const assignedCarrier = carriers.find((c) => c._id === trip.assignedCarrier);

            return (
              <Card key={trip._id} className="border-border bg-card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left: trip info */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">{trip.name}</h2>
                      <TripStatusBadge status={trip.status} />
                      <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs">
                        {trip.region}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {trip.startCity} → {trip.endCity}
                    </p>

                    {trip.stops.length > 0 && (
                      <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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

                    <p className="text-xs text-muted-foreground">
                      Created {new Date(trip.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Right: controls */}
                  <div className="flex flex-col gap-3 lg:w-64">
                    {/* Status */}
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Status
                      </div>
                      <Select
                        value={trip.status}
                        onValueChange={(v) => setStatus(trip._id, v as TripStatus)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Carrier assignment */}
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Assigned carrier
                      </div>
                      <Select
                        value={trip.assignedCarrier ?? UNASSIGNED}
                        onValueChange={(v) => assignCarrier(trip._id, v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                          {carriers.map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                              {c.fullName}{c.carrierId ? ` · ${c.carrierId}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {assignedCarrier && (
                        <p className="text-xs text-muted-foreground">
                          {assignedCarrier.fullName}
                          {assignedCarrier.carrierId ? (
                            <span className="font-mono"> · {assignedCarrier.carrierId}</span>
                          ) : null}
                        </p>
                      )}
                      {carriers.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No carrier accounts yet.
                        </p>
                      )}
                    </div>

                    {/* Delete */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 w-full gap-2 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget({ id: trip._id, name: trip.name || "this trip" })}
                      disabled={deleteTrip.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete trip
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete trip?"
        description={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete trip"
        destructive
        pending={deleteTrip.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
