/**
 * Webhooks API — wired to the backend.
 *
 *   GET    /api/v1/webhooks          -> { data: BackendWebhook[] }   (admin)
 *   POST   /api/v1/webhooks          body: { url, event, active }    (admin)
 *   PATCH  /api/v1/webhooks/:id      body: Partial<...>              (admin)
 *   DELETE /api/v1/webhooks/:id      (admin)
 *   GET    /api/v1/webhooks/logs     -> { data: BackendWebhookLog[] }(admin)
 *
 * Event model is status-based (PackageStatus | "all"). Dispatch + logging happen
 * server-side on each package status change.
 */

import { request } from "@packetflow/backend-client";
import type { PackageStatus, Webhook, WebhookLog } from "@packetflow/types";

interface Wrapped<T> {
  data: T;
}

interface BackendWebhook {
  _id: string;
  name?: string;
  url: string;
  event: PackageStatus | "all";
  active: boolean;
  createdAt: string;
}

interface BackendWebhookLog {
  _id: string;
  webhook: string | { _id: string };
  package?: string;
  event: string;
  payload: string;
  delivered: boolean;
  createdAt: string;
}

const toWebhook = (w: BackendWebhook): Webhook => ({
  id: w._id,
  url: w.url,
  event: w.event,
  active: w.active,
  createdAt: w.createdAt,
});

const toWebhookLog = (l: BackendWebhookLog): WebhookLog => ({
  id: l._id,
  webhookId: typeof l.webhook === "string" ? l.webhook : l.webhook?._id,
  packageId: l.package ?? "",
  event: l.event as PackageStatus,
  payload: l.payload,
  timestamp: l.createdAt,
  delivered: l.delivered,
});

export async function listWebhooks(): Promise<Webhook[]> {
  const res = await request<Wrapped<BackendWebhook[]>>("/webhooks");
  return res.data.map(toWebhook);
}

export async function createWebhook(input: {
  url: string;
  event: PackageStatus | "all";
  active: boolean;
}): Promise<Webhook> {
  const res = await request<Wrapped<BackendWebhook>>("/webhooks", {
    method: "POST",
    body: input,
  });
  return toWebhook(res.data);
}

export async function updateWebhook(
  id: string,
  patch: Partial<Omit<Webhook, "id" | "createdAt">>,
): Promise<Webhook> {
  const res = await request<Wrapped<BackendWebhook>>(`/webhooks/${id}`, {
    method: "PATCH",
    body: patch as Record<string, unknown>,
  });
  return toWebhook(res.data);
}

export async function deleteWebhook(id: string): Promise<void> {
  await request(`/webhooks/${id}`, { method: "DELETE" });
}

export async function listWebhookLogs(): Promise<WebhookLog[]> {
  const res = await request<Wrapped<BackendWebhookLog[]>>("/webhooks/logs");
  return res.data.map(toWebhookLog);
}
