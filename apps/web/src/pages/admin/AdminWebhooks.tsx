import { useEffect, useState } from "react";
import { Plus, Trash2, Webhook as WebhookIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createWebhook, deleteWebhook, listWebhookLogs, listWebhooks, updateWebhook } from "@/api/webhooks";
import { statusLabels } from "@packetflow/types";
import type { PackageStatus, Webhook, WebhookLog } from "@packetflow/types";

const EVENTS: (PackageStatus | "all")[] = ["all", "registered", "in_transit", "out_for_delivery", "delivered", "exception"];

export default function AdminWebhooks() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState<PackageStatus | "all">("all");
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);

  // TODO: replace with useQuery hooks once the API endpoints are live
  const reload = () => {
    listWebhooks().then(setWebhooks).catch(() => {});
    listWebhookLogs().then(setLogs).catch(() => {});
  };

  useEffect(reload, []);

  const add = async () => {
    if (!url) return;
    await createWebhook({ url, event, active: true });
    setUrl(""); setEvent("all"); setOpen(false);
    reload();
  };

  const remove = async (id: string) => {
    await deleteWebhook(id);
    reload();
  };

  const toggle = async (w: Webhook) => {
    await updateWebhook(w.id, { active: !w.active });
    reload();
  };

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="mt-1 text-muted-foreground">Get notified at your endpoint when packages change status.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full"><WebhookIcon className="h-4 w-4" /> Add webhook</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New webhook</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Endpoint URL</Label>
                <Input className="mt-1.5" placeholder="https://your-app/hooks/packetflow" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
              <div>
                <Label>Event</Label>
                <Select value={event} onValueChange={(v) => setEvent(v as PackageStatus | "all")}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENTS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e === "all" ? "All events" : statusLabels[e as PackageStatus]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={add}><Plus className="h-4 w-4" /> Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wider text-muted-foreground">Endpoints</h2>
        <div className="space-y-2">
          {webhooks.length === 0 && (
            <Card className="bg-muted p-8 text-center text-muted-foreground">No webhooks configured.</Card>
          )}
          {webhooks.map((w) => (
            <Card key={w.id} className="flex items-center justify-between border-border bg-card p-4">
              <div className="min-w-0">
                <div className="truncate font-mono text-sm">{w.url}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Event: {w.event === "all" ? "all" : statusLabels[w.event as PackageStatus]}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={w.active} onCheckedChange={() => toggle(w)} />
                <button onClick={() => remove(w.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wider text-muted-foreground">Recent deliveries</h2>
        {logs.length === 0 ? (
          <Card className="bg-muted p-8 text-center text-muted-foreground">
            No deliveries yet. Update a package status under <span className="font-medium text-foreground">Packages</span> to trigger one.
          </Card>
        ) : (
          <Card className="overflow-hidden border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Event</th>
                  <th className="px-4 py-3 text-left">Endpoint</th>
                  <th className="px-4 py-3 text-left">Payload</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 30).map((l) => {
                  const wh = webhooks.find((w) => w.id === l.webhookId);
                  return (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-4 py-3 text-muted-foreground">{new Date(l.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs">
                          {statusLabels[l.event]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{wh?.url ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.payload}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}
