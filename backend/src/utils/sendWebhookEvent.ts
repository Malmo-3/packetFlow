import Webhook from "../models/webhook.model";

type WebhookEvent =
  | "package.status_changed"
  | "delivery.status_changed"
  | "scan.created";

type WebhookPayload = Record<string, unknown>;

export const sendWebhookEvent = async (
  event: WebhookEvent,
  payload: WebhookPayload,
): Promise<void> => {
  const webhooks = await Webhook.find({
    event,
    isActive: true,
  });

  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(webhook.secret
            ? { "x-packetflow-webhook-secret": webhook.secret }
            : {}),
        },
        body: JSON.stringify({
          event,
          sentAt: new Date().toISOString(),
          data: payload,
        }),
      });
    }),
  );
};
