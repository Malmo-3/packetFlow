/**
 * Webhook dispatch on package status change.
 *
 * Fires every active webhook whose `event` matches the new status (or is "all"),
 * POSTs the payload, and records a WebhookLog. Failures are isolated per
 * subscriber (Promise.allSettled) so a bad URL never breaks the triggering request.
 */

import Webhook from "../models/webhook.model";
import WebhookLog from "../models/webhookLog.model";
import type { PackageStatus } from "../shared/skane";

interface DispatchInput {
  status: PackageStatus;
  packageId: string;
  trackingNumber: string;
  extra?: Record<string, unknown>;
}

export const dispatchPackageStatusWebhooks = async ({
  status,
  packageId,
  trackingNumber,
  extra = {},
}: DispatchInput): Promise<void> => {
  const webhooks = await Webhook.find({
    active: true,
    $or: [{ event: status }, { event: "all" }],
  });

  if (webhooks.length === 0) return;

  const payload = {
    event: status,
    packageId,
    trackingNumber,
    sentAt: new Date().toISOString(),
    ...extra,
  };
  const body = JSON.stringify(payload);

  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      let delivered = false;
      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        delivered = res.ok;
      } catch {
        delivered = false;
      }
      await WebhookLog.create({
        webhook: webhook._id,
        package: packageId,
        event: status,
        payload: body,
        delivered,
      });
    }),
  );
};
