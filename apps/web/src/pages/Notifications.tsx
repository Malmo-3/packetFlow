import { Bell, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useMarkOneRead,
  useMarkAllRead,
} from "@/api/hooks/useNotifications";
import type { BackendNotification } from "@packetflow/api-client";

const TYPE_LABELS: Record<BackendNotification["type"], string> = {
  package_registered: "Package registered",
  status_updated: "Status updated",
  arrived_at_dropoff: "Arrived at drop-off",
  package_picked_up: "Package picked up",
};

function NotifCard({ n, onRead }: { n: BackendNotification; onRead: (id: string) => void }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
        n.read ? "border-border bg-card" : "border-border bg-muted"
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          n.read ? "bg-secondary text-muted-foreground" : "bg-secondary text-foreground"
        }`}
      >
        <Bell className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
              n.read
                ? "border-border bg-secondary text-muted-foreground"
                : "border-border bg-secondary text-foreground"
            }`}
          >
            {TYPE_LABELS[n.type]}
          </span>
          <time className="shrink-0 text-xs text-muted-foreground">
            {new Date(n.createdAt).toLocaleString("sv-SE", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </time>
        </div>
        <p className="mt-1.5 text-sm text-foreground">{n.message}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{n.trackingNumber}</p>
      </div>

      {!n.read && (
        <button
          onClick={() => onRead(n._id)}
          title="Mark as read"
          className="shrink-0 text-muted-foreground hover:underline"
        >
          <Check className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markOne = useMarkOneRead();
  const markAll = useMarkAllRead();

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            <Check className="mr-1.5 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </header>

      {isLoading ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">
          Loading notifications…
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="bg-muted p-10 text-center text-muted-foreground">
          No notifications yet.
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotifCard key={n._id} n={n} onRead={(id) => markOne.mutate(id)} />
          ))}
        </div>
      )}
    </div>
  );
}
