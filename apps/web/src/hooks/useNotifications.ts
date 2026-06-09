/**
 * React Query hooks for the Notifications resource.
 *
 * The `useNotifications` hook polls every 30 seconds so the unread badge in the
 * sidebar stays reasonably fresh without requiring a WebSocket connection.
 * Marking notifications as read invalidates the cache immediately.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type BackendNotification } from "@packetflow/backend-client";

export const notifKeys = {
  all: ["notifications"] as const,
};

/**
 * Fetch the current user's notifications.
 * Returns `{ data: BackendNotification[]; unreadCount: number }`.
 * Auto-refetches every 30 seconds.
 */
export function useNotifications() {
  return useQuery<{ data: BackendNotification[]; unreadCount: number }>({
    queryKey: notifKeys.all,
    queryFn: ({ signal }) => notificationsApi.listNotifications(signal),
    refetchInterval: 30_000,
  });
}

/** Mark a single notification as read. Invalidates the notification list. */
export function useMarkOneRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markOneRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  });
}

/** Mark all of the current user's notifications as read in one request. */
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  });
}

/** Delete a single notification. Invalidates the notification list. */
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  });
}

/** Delete all of the current user's notifications in one request. */
export function useDeleteAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.deleteAllNotifications(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  });
}
