import { useState } from "react";
import { Link } from "react-router-dom";
import { PackagePlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useSenderPackages } from "./usePackages";
import { StatusBadge } from "./StatusBadge";
import { BatchImport } from "@/components/BatchImport";
import type { PackageStatus } from "@packetflow/types";

const FILTERS: { id: "all" | PackageStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "registered", label: "Registered" },
  { id: "in_transit", label: "In Transit" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
];

export default function SenderShipments() {
  const { user } = useAuth();
  const [_tick, setTick] = useState(0);
  const [filter, setFilter] = useState<"all" | PackageStatus>("all");
  const [q, setQ] = useState("");

  const { data: senderPackages = [], isLoading, refetch } = useSenderPackages(user?.id);
  const all = senderPackages;
  const filtered = all.filter(
    (p) =>
      (filter === "all" || p.status === filter) &&
      (q.length === 0 ||
        p.trackingCode.toLowerCase().includes(q.toLowerCase()) ||
        p.recipientName.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My shipments</h1>
          <p className="mt-1 text-muted-foreground">{all.length} packages registered.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/sender/packages/new">
            <PackagePlus className="h-4 w-4" /> Create package
          </Link>
        </Button>
      </header>

      <BatchImport
        onImported={() => {
          setTick((t) => t + 1);
          refetch();
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.id
                  ? "border-border bg-secondary text-foreground"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search code or recipient" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">Loading packages...</Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">No packages match your filters.</Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Tracking</th>
                <th className="px-4 py-3 text-left">Recipient</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">ETA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <Link to={`/sender/packages/${p.id}`} className="font-mono text-sm hover:underline">
                      {p.trackingCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.recipientName}</div>
                    <div className="text-xs text-muted-foreground">{p.recipientAddress}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {p.estimatedDelivery ? new Date(p.estimatedDelivery).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
