import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Package as PackageIcon, RefreshCw, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { TrackingMap } from "@/components/TrackingMap";
import { useAuth } from "@/lib/auth";
import { usePackageByCode } from "@/features/packages/usePackages";
import { getPackageTrip } from "@/features/packages/packagesApi";
import { listScansForPackage } from "@/api/scans";
import { listSavedTracking, removeTrackingCode, saveTrackingCode } from "@/api/savedTracking";
import { ScanTimeline } from "@/features/packages/ScanTimeline";
import { StatusBadge } from "@/features/packages/StatusBadge";
import { toast } from "@/hooks/use-toast";
import type { Scan } from "@packetflow/types";
import type { BackendTrip } from "@packetflow/backend-client";

export default function RecipientTrackResult() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: pkg, isLoading, refetch } = usePackageByCode(code);
  const [scans, setScans] = useState<Scan[]>([]);
  const [trip, setTrip] = useState<BackendTrip | null>(null);
  const [savedCodes, setSavedCodes] = useState<string[]>([]);

  // Re-fetch tracking every 30s for the polling effect the UI advertises.
  useEffect(() => {
    const i = setInterval(() => refetch(), 30_000);
    return () => clearInterval(i);
  }, [refetch]);

  useEffect(() => {
    if (!pkg?.id) return;
    let cancelled = false;
    const load = () =>
      listScansForPackage(pkg.id).then((result) => {
        if (!cancelled) setScans(result);
      });
    load();
    // Poll so the timeline updates as the carrier scans/advances.
    const i = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [pkg?.id]);

  // The package's trip drives the live map (all stops + the carrier's current
  // position, advanced from the mobile app). Polled so the marker keeps moving.
  useEffect(() => {
    if (!pkg?.id) return;
    let cancelled = false;
    const load = () => getPackageTrip(pkg.id).then((t) => { if (!cancelled) setTrip(t); }).catch(() => {});
    load();
    const i = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(i); };
  }, [pkg?.id]);

  const journey = trip ? [trip.startCity, ...(trip.stops ?? []), trip.endCity] : undefined;

  useEffect(() => {
    if (!user) {
      setSavedCodes([]);
      return;
    }
    let cancelled = false;
    listSavedTracking(user.id).then((codes) => {
      if (!cancelled) setSavedCodes(codes);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // TODO: fetch carrier from GET /api/v1/carriers/:id once that endpoint exists
  const isSaved = user && pkg ? savedCodes.includes(pkg.trackingCode) : false;

  const toggleSave = async () => {
    if (!user || !pkg) return;
    try {
      if (isSaved) {
        await removeTrackingCode(user.id, pkg.trackingCode);
        setSavedCodes((prev) => prev.filter((c) => c !== pkg.trackingCode));
        toast({ title: "Removed from saved" });
      } else {
        await saveTrackingCode(user.id, pkg.trackingCode);
        setSavedCodes((prev) => [...prev, pkg.trackingCode]);
        toast({ title: "Saved to your list" });
      }
    } catch {
      toast({ title: "Could not save package", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal top nav for public page */}
      <div className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4 md:px-10">
          <Logo className="h-7 w-auto" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {isLoading && (
          <p className="text-muted-foreground">Looking up tracking...</p>
        )}

        {!isLoading && !pkg && (
          <div className="py-16 text-center">
            <h1 className="text-2xl font-bold">Package not found</h1>
            <p className="mt-2 text-muted-foreground">Check the tracking code and try again.</p>
            <Button className="mt-4" onClick={() => navigate(-1)}>Go back</Button>
          </div>
        )}

        {pkg && (
          <>
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="font-mono text-sm text-muted-foreground">{pkg.trackingCode}</div>
                <h1 className="mt-1 text-3xl font-bold">Package to {pkg.recipientName}</h1>
                <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {pkg.recipientAddress}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={pkg.status} className="text-sm" />
                {user && (
                  <Button
                    variant={isSaved ? "secondary" : "default"}
                    size="sm"
                    className="rounded-full"
                    onClick={toggleSave}
                  >
                    <Star className={`h-4 w-4 ${isSaved ? "fill-foreground text-foreground" : ""}`} />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                )}
              </div>
            </header>

            <Card className="border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Live map</h2>
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-pulse-dot" /> Live · refreshes every 30s
                </span>
              </div>
              <TrackingMap
                pickupCity={pkg.pickupCity}
                destinationCity={pkg.destinationCity}
                scans={scans}
                status={pkg.status}
                journey={journey}
                currentStopIndex={trip?.currentStopIndex ?? 0}
              />
              {journey && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {pkg.status === "delivered"
                    ? "Delivered"
                    : `Currently at ${journey[Math.min(trip?.currentStopIndex ?? 0, journey.length - 1)]}`}
                </p>
              )}
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <Card className="border-border bg-card p-6">
                <h2 className="mb-5 text-lg font-bold">Journey</h2>
                <ScanTimeline scans={scans} />
              </Card>

              <Card className="border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-bold">Details</h2>
                <dl className="space-y-3 text-sm">
                  <Row icon={PackageIcon} label="Weight" value={`${pkg.weightKg} kg`} />
                  <Row
                    icon={PackageIcon}
                    label="Dimensions"
                    value={`${pkg.dimensions.length} × ${pkg.dimensions.width} × ${pkg.dimensions.height} cm`}
                  />
                  <Row icon={Truck} label="Carrier" value={trip?.assignedCarrierCode ?? "Awaiting assignment"} />
                </dl>
                {!user && (
                  <div className="mt-5 rounded-md border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                    <Link to="/login" className="text-foreground font-medium underline-offset-4 hover:underline">Sign in</Link> to save this package.
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
