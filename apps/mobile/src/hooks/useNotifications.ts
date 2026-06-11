import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type BackendNotification } from "@packetflow/backend-client";

export const notifKeys = { all: ["notifications"] as const };

export function useNotifications() {
  return useQuery<{ data: BackendNotification[]; unreadCount: number }>({
    queryKey: notifKeys.all,
    queryFn: ({ signal }) => notificationsApi.listNotifications(signal),
    refetchInterval: 30_000,
  });
}

export function useMarkOneRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markOneRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  });
}

export function useDeleteAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.deleteAllNotifications(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  });
}
