/**
 * Webhooks API
 *
 * BACKEND CONTRACT:
 *   GET    /api/v1/webhooks          -> Webhook[]
 *   POST   /api/v1/webhooks          body: { url, event, active }  -> Webhook
 *   PATCH  /api/v1/webhooks/:id      body: Partial<Webhook>        -> Webhook
 *   DELETE /api/v1/webhooks/:id      -> 204
 *   GET    /api/v1/webhooks/logs     -> WebhookLog[]
 *
 * Note: webhook dispatch is handled server-side on package status change.
 * The client only reads logs — it never posts them directly.
 */

import type { PackageStatus, Webhook, WebhookLog } from "@packetflow/types";

export async function listWebhooks(): Promise<Webhook[]> {
  throw new Error("TODO: GET /api/v1/webhooks");
}

export async function createWebhook(_input: { url: string; event: PackageStatus | "all"; active: boolean }): Promise<Webhook> {
  throw new Error("TODO: POST /api/v1/webhooks");
}

export async function updateWebhook(_id: string, _patch: Partial<Omit<Webhook, "id" | "createdAt">>): Promise<Webhook> {
  throw new Error("TODO: PATCH /api/v1/webhooks/:id");
}

export async function deleteWebhook(_id: string): Promise<void> {
  throw new Error("TODO: DELETE /api/v1/webhooks/:id");
}

export async function listWebhookLogs(): Promise<WebhookLog[]> {
  throw new Error("TODO: GET /api/v1/webhooks/logs");
}
