import { Schema, model } from "mongoose";
import type { PackageStatus } from "../shared/skane";
import { PACKAGE_STATUSES } from "../shared/skane";

/** A webhook subscribes to a package status (or "all" statuses). */
export type WebhookEvent = PackageStatus | "all";

export interface IWebhook {
  name?: string;
  url: string;
  event: WebhookEvent;
  active: boolean;
}

const webhookSchema = new Schema<IWebhook>(
  {
    name: { type: String, required: false, trim: true },
    url: { type: String, required: true, trim: true },
    event: {
      type: String,
      enum: [...PACKAGE_STATUSES, "all"],
      required: true,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Webhook = model<IWebhook>("Webhook", webhookSchema);

export default Webhook;
