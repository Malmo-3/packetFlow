import { Schema, model } from "mongoose";

export type WebhookEvent =
  | "package.status_changed"
  | "delivery.status_changed"
  | "scan.created";

export interface IWebhook {
  name: string;
  url: string;
  event: WebhookEvent;
  secret?: string;
  isActive: boolean;
}

const webhookSchema = new Schema<IWebhook>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    event: {
      type: String,
      enum: [
        "package.status_changed",
        "delivery.status_changed",
        "scan.created",
      ],
      required: true,
    },
    secret: {
      type: String,
      required: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Webhook = model<IWebhook>("Webhook", webhookSchema);

export default Webhook;
