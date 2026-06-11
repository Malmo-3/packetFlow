import { View, Text, Pressable, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { confirmAction } from "../../src/lib/dialog";
import type { BackendNotification } from "@packetflow/backend-client";
import { useTheme } from "../../src/theme/ThemeProvider";
import {
  useNotifications,
  useMarkOneRead,
  useMarkAllRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "../../src/hooks/useNotifications";
import { Screen, ScreenHeader, Card, Button, Loading, EmptyState } from "../../src/components/ui";
import { formatDateTime } from "../../src/lib/format";

const TYPE_LABELS: Record<BackendNotification["type"], string> = {
  package_registered: "Package registered",
  status_updated: "Status updated",
  arrived_at_dropoff: "Arrived at drop-off",
  package_picked_up: "Package picked up",
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const markOne = useMarkOneRead();
  const markAll = useMarkAllRead();
  const deleteOne = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();

  const notifications = data?.data ?? [];
  const unread = data?.unreadCount ?? 0;

  const confirmClearAll = () => {
    confirmAction({
      title: "Clear all notifications?",
      message: "This cannot be undone.",
      confirmLabel: "Clear all",
      destructive: true,
      onConfirm: () => deleteAll.mutate(),
    });
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.foreground} />}>
      <ScreenHeader title="Notifications" subtitle={unread > 0 ? `${unread} unread` : "All caught up"} />

      {notifications.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {unread > 0 && <Button label="Mark all read" variant="secondary" icon="checkmark-done" onPress={() => markAll.mutate()} />}
          <Button label="Clear all" variant="outline" icon="trash-outline" onPress={confirmClearAll} />
        </View>
      )}

      {isLoading ? (
        <Loading />
      ) : notifications.length === 0 ? (
        <Card>
          <EmptyState icon="notifications-outline" title="No notifications yet" />
        </Card>
      ) : (
        notifications.map((n) => (
          <Card key={n._id} style={{ gap: 6, backgroundColor: n.read ? colors.card : colors.muted }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="notifications-outline" size={16} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 13, flex: 1 }}>{TYPE_LABELS[n.type] ?? n.type}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{formatDateTime(n.createdAt)}</Text>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 14 }}>{n.message}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "monospace" }}>{n.trackingNumber}</Text>
            <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
              {!n.read && (
                <Pressable onPress={() => markOne.mutate(n._id)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="checkmark" size={16} color={colors.mutedForeground} />
                  <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Mark read</Text>
                </Pressable>
              )}
              <Pressable onPress={() => deleteOne.mutate(n._id)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                <Text style={{ color: colors.destructive, fontSize: 13 }}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
