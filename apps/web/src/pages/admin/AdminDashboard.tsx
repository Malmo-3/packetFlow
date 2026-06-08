import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { usePackages } from "@/api/hooks/usePackages";
import { listCarriers } from "@/api/carriers";
import { listRoutes } from "@/api/trips";
import { listUsers } from "@/api/users";
import { listWebhooks, listWebhookLogs } from "@/api/webhooks";
import type { Webhook, WebhookLog } from "@packetflow/types";

export default function AdminDashboard() {
  const { data: packages = [] } = usePackages();

  // TODO: replace with React Query hooks once the API endpoints are live
  const [userCount, setUserCount] = useState(0);
  const [carrierCount, setCarrierCount] = useState(0);
  const [routeCount, setRouteCount] = useState(0);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);

  useEffect(() => {
    listUsers().then((u) => setUserCount(u.length)).catch(() => {});
    listCarriers().then((c) => setCarrierCount(c.length)).catch(() => {});
    listRoutes().then((r) => setRouteCount(r.length)).catch(() => {});
    listWebhooks().then(setWebhooks).catch(() => {});
    listWebhookLogs().then(setWebhookLogs).catch(() => {});
  }, []);

  const statusCounts = {
    registered: packages.filter((pkg) => pkg.status === "registered").length,
    inTransit: packages.filter((pkg) => pkg.status === "in_transit").length,
    outForDelivery: packages.filter((pkg) => pkg.status === "out_for_delivery").length,
    delivered: packages.filter((pkg) => pkg.status === "delivered").length,
    exception: packages.filter((pkg) => pkg.status === "exception").length,
  };

  const cards = [
    { label: "Shipments",       value: packages.length,  helper: "Total across all senders" },
    { label: "Users",           value: userCount,        helper: "Admin, sender, recipient, carrier accounts" },
    { label: "Carriers",        value: carrierCount,     helper: "Fleet resources in this workspace" },
    { label: "Trips",           value: routeCount,       helper: "Configured multi-stop delivery routes" },
    { label: "Integrations",    value: webhooks.length,  helper: "Integration endpoints configured" },
    { label: "Delivery Events", value: webhookLogs.length, helper: "Recorded deliveries to endpoints" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Operations Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Real-time visibility of deliveries, users, and system activity.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{card.helper}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-bold">Shipment Status Overview</h2>
          <div className="space-y-3">
            <StatusRow label="Registered"       value={statusCounts.registered}    total={packages.length} />
            <StatusRow label="In transit"        value={statusCounts.inTransit}     total={packages.length} />
            <StatusRow label="Out for delivery"  value={statusCounts.outForDelivery} total={packages.length} />
            <StatusRow label="Delivered"         value={statusCounts.delivered}     total={packages.length} />
            <StatusRow label="Exception"         value={statusCounts.exception}     total={packages.length} />
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-bold">Active Integrations</h2>
          {webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No webhooks are configured yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {webhooks.slice(0, 6).map((hook) => (
                <li key={hook.id} className="rounded-md border border-border bg-secondary/40 px-3 py-2">
                  <div className="truncate font-mono text-xs">{hook.url}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Event: {hook.event} · {hook.active ? "active" : "inactive"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wider text-muted-foreground">Recent Delivery Events</h2>
        {webhookLogs.length === 0 ? (
          <Card className="bg-muted p-8 text-center text-muted-foreground">
            No delivery events yet. Webhook activity will appear here once shipment updates are triggered.
          </Card>
        ) : (
          <Card className="overflow-hidden border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">Event</th>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Delivered</th>
                </tr>
              </thead>
              <tbody>
                {webhookLogs.slice(0, 12).map((log) => (
                  <tr key={log.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 capitalize">{log.event.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.packageId}</td>
                    <td className="px-4 py-3">{log.delivered ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}

function StatusRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value} ({pct}%)</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
