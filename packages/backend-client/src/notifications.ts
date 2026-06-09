/**
 * Notifications API client.
 *
 * In-app notifications are created server-side when a carrier triggers a
 * package event (`/arrive` or `/pickup`). The recipient and/or sender receive
 * a notification if their email matches a registered account.
 *
 * Endpoints:
 * - `GET   /api/v1/notifications`          → list the caller's notifications (last 50)
 * - `PATCH /api/v1/notifications/read-all` → mark all as read
 * - `PATCH /api/v1/notifications/:id/read` → mark one as read
 * - `DELETE /api/v1/notifications/:id`     → delete one
 * - `DELETE /api/v1/notifications`         → delete all
 */

import { request } from "./client";

/** The event that triggered a notification. */
export type NotificationType =
  | "package_registered"
  | "status_updated"
  | "arrived_at_dropoff"
  | "package_picked_up";

/** A single in-app notification. */
export interface BackendNotification {
  _id: string;
  /** The user who should see this notification. */
  userId: string;
  type: NotificationType;
  /** MongoDB `_id` of the related package. */
  packageId: string;
  trackingNumber: string;
  message: string;
  /** `false` until the user reads or dismisses it. */
  read: boolean;
  createdAt: string;
}

interface ListResponse {
  success: boolean;
  data: BackendNotification[];
  unreadCount: number;
}

/**
 * Fetch the calling user's notifications (newest first, capped at 50).
 * Returns the list and a pre-computed `unreadCount` for badge display.
 */
export async function listNotifications(
  signal?: AbortSignal,
): Promise<{ data: BackendNotification[]; unreadCount: number }> {
  const res = await request<ListResponse>("/notifications", { signal });
  return { data: res.data ?? [], unreadCount: res.unreadCount ?? 0 };
}

/** Mark a single notification as read by its `_id`. */
export async function markOneRead(id: string): Promise<void> {
  await request(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
}

/** Mark all of the calling user's notifications as read in one request. */
export async function markAllRead(): Promise<void> {
  await request("/notifications/read-all", { method: "PATCH" });
}

/** Delete a single notification by its `_id`. */
export async function deleteNotification(id: string): Promise<void> {
  await request(`/notifications/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Delete all of the calling user's notifications in one request. */
export async function deleteAllNotifications(): Promise<void> {
  await request("/notifications", { method: "DELETE" });
}
