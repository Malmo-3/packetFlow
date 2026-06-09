import { useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "@/hooks/use-toast";
import {
  useNotifications,
  useMarkOneRead,
  useMarkAllRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "@/hooks/useNotifications";
import type { BackendNotification } from "@packetflow/backend-client";

const TYPE_LABELS: Record<BackendNotification["type"], string> = {
  package_registered: "Package registered",
  status_updated: "Status updated",
  arrived_at_dropoff: "Arrived at drop-off",
  package_picked_up: "Package picked up",
};

function NotifCard({
  n,
  onRead,
  onDelete,
  deleting,
}: {
  n: BackendNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
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

      <div className="flex shrink-0 items-center gap-2">
        {!n.read && (
          <button
            onClick={() => onRead(n._id)}
            title="Mark as read"
            className="text-muted-foreground hover:text-foreground"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(n._id)}
          disabled={deleting}
          title="Delete notification"
          className="text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markOne = useMarkOneRead();
  const markAll = useMarkAllRead();
  const deleteOne = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleDeleteOne = (id: string) => {
    deleteOne.mutate(id, {
      onSuccess: () => toast({ title: "Notification deleted" }),
      onError: () => toast({ title: "Failed to delete notification", variant: "destructive" }),
    });
  };

  const handleClearAll = () => {
    deleteAll.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "All notifications cleared" });
        setConfirmClearAll(false);
      },
      onError: () => toast({ title: "Failed to clear notifications", variant: "destructive" }),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => setConfirmClearAll(true)}
              disabled={deleteAll.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
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
            <NotifCard
              key={n._id}
              n={n}
              onRead={(id) => markOne.mutate(id)}
              onDelete={handleDeleteOne}
              deleting={deleteOne.isPending && deleteOne.variables === n._id}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmClearAll}
        title="Clear all notifications?"
        description={`All ${notifications.length} notification${notifications.length !== 1 ? "s" : ""} will be permanently deleted. This cannot be undone.`}
        confirmLabel="Clear all"
        destructive
        pending={deleteAll.isPending}
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClearAll(false)}
      />
    </div>
  );
}
