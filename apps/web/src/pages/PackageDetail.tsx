import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, MapPin, Package as PackageIcon, Truck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { estimateDelivery, progressForStatus } from "@/lib/utils";
import { usePackage } from "@/features/packages/usePackages";
import { listScansForPackage } from "@/api/scans";
import { ScanTimeline } from "@/features/packages/ScanTimeline";
import { StatusBadge } from "@/features/packages/StatusBadge";
import { toast } from "@/hooks/use-toast";
import type { Scan } from "@packetflow/types";

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: pkg, isLoading, isError } = usePackage(id);
  const [scans, setScans] = useState<Scan[]>([]);

  useEffect(() => {
    if (!pkg?.id) return;
    let cancelled = false;
    listScansForPackage(pkg.id).then((result) => {
      if (!cancelled) setScans(result);
    });
    return () => {
      cancelled = true;
    };
  }, [pkg?.id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md text-center text-muted-foreground">
        Loading package...
      </div>
    );
  }

  if (isError || !pkg) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-bold">Package not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed.</p>
        <Button className="mt-4" onClick={() => navigate("/sender/packages")}>Back to shipments</Button>
      </div>
    );
  }

  // TODO: fetch route and carrier from the API once those endpoints are live
  const route = undefined;
  const carrier = undefined;
  const eta = estimateDelivery(pkg);
  const progress = progressForStatus(pkg.status);

  return (
    <div className="space-y-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg">{pkg.trackingCode}</span>
            <button
              className="text-muted-foreground hover:underline"
              onClick={() => {
                navigator.clipboard.writeText(pkg.trackingCode);
                toast({ title: "Copied tracking code" });
              }}
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <h1 className="mt-2 text-3xl font-bold">{pkg.recipientName}</h1>
          <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {pkg.recipientAddress}
          </div>
        </div>
        <StatusBadge status={pkg.status} className="text-sm" />
      </header>

      <Card className="border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>Delivery progress</span>
          <span>{eta && pkg.status !== "delivered" ? `ETA ${new Date(eta).toLocaleDateString()}` : pkg.status === "delivered" ? "Delivered" : "—"}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-foreground transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
          <div>Registered</div>
          <div>In transit</div>
          <div>Out for delivery</div>
          <div className="text-right">Delivered</div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="border-border bg-card p-6">
          <h2 className="mb-5 text-lg font-bold">Scan history</h2>
          <ScanTimeline scans={scans} />
        </Card>

        <div className="space-y-6">
          <Card className="border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Parcel details</h2>
            <dl className="space-y-3 text-sm">
              <Row icon={PackageIcon} label="Weight" value={`${pkg.weightKg} kg`} />
              <Row icon={PackageIcon} label="Dimensions" value={`${pkg.dimensions.length} × ${pkg.dimensions.width} × ${pkg.dimensions.height} cm`} />
              <Row icon={User} label="Recipient" value={pkg.recipientName} />
              <Row icon={Truck} label="Carrier" value={carrier?.name ?? "Unassigned"} />
              <Row icon={MapPin} label="Route" value={route?.name ?? "Unassigned"} />
            </dl>
            {pkg.notes && (
              <div className="mt-4 rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
                {pkg.notes}
              </div>
            )}
          </Card>

          <Card className="border-border bg-card p-6">
            <h2 className="mb-2 text-lg font-bold">Share</h2>
            <p className="text-sm text-muted-foreground">Recipients can paste the tracking code at:</p>
            <Link
              to={`/track/${pkg.trackingCode}`}
              className="mt-2 inline-block break-all rounded-md bg-secondary px-3 py-2 font-mono text-xs hover:underline"
            >
              /track/{pkg.trackingCode}
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
