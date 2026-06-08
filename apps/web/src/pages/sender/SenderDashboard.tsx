import { Link } from "react-router-dom";
import { Box, PackagePlus, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useSenderPackages } from "@/api/hooks/usePackages";

export default function SenderDashboard() {
  const { user } = useAuth();
  const { data: senderPackages = [], isLoading } = useSenderPackages(user?.id);
  const packages = [...senderPackages].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const registered = packages.filter((pkg) => pkg.status === "registered").length;
  const inTransit = packages.filter((pkg) => pkg.status === "in_transit").length;
  const outForDelivery = packages.filter((pkg) => pkg.status === "out_for_delivery").length;
  const delivered = packages.filter((pkg) => pkg.status === "delivered").length;
  const exception = packages.filter((pkg) => pkg.status === "exception").length;
  const recent = packages.slice(0, 5);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sender overview</h1>
          <p className="mt-1 text-muted-foreground">
            Track your shipment pipeline and jump into package operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-full">
            <Link to="/sender/packages/new">
              <PackagePlus className="h-4 w-4" /> Create package
            </Link>
          </Button>
          <Button asChild variant="secondary" className="rounded-full">
            <Link to="/sender/packages">
              <Send className="h-4 w-4" /> My shipments
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Total packages" value={packages.length} helper="All shipment records created by you" />
        <MetricCard label="Registered" value={registered} helper="Awaiting first route movement" />
        <MetricCard label="In transit" value={inTransit} helper="Currently moving through checkpoints" />
        <MetricCard label="Out for delivery" value={outForDelivery} helper="On final-mile vehicle" />
        <MetricCard label="Delivered" value={delivered} helper="Successfully delivered to recipients" />
        <MetricCard label="Exceptions" value={exception} helper="Requires investigation or action" />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Recent packages</h2>
        {isLoading ? (
          <Card className="bg-muted p-10 text-center text-muted-foreground">Loading packages...</Card>
        ) : recent.length === 0 ? (
          <Card className="bg-muted p-10 text-center text-muted-foreground">
            You have no shipments yet. Create your first package to start tracking.
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Tracking</th>
                  <th className="px-4 py-3 text-left">Recipient</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((pkg) => (
                  <tr key={pkg.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <Link to={`/sender/packages/${pkg.id}`} className="font-mono hover:underline">
                        {pkg.trackingCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{pkg.recipientName}</div>
                      <div className="text-xs text-muted-foreground">{pkg.recipientAddress}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-border bg-secondary px-2 py-0.5 text-xs capitalize text-foreground">
                        {pkg.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {new Date(pkg.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <Card className="border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <Box className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
    </Card>
  );
}
