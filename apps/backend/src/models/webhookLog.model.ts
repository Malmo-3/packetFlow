import { Schema, model, Types } from "mongoose";

/** A delivery attempt record for an outbound webhook. */
export interface IWebhookLog {
  webhook: Types.ObjectId;
  package?: Types.ObjectId;
  event: string;
  /** JSON-serialised payload that was sent. */
  payload: string;
  delivered: boolean;
}

const webhookLogSchema = new Schema<IWebhookLog>(
  {
    webhook: { type: Schema.Types.ObjectId, ref: "Webhook", required: true, index: true },
    package: { type: Schema.Types.ObjectId, ref: "Package", required: false },
    event: { type: String, required: true },
    payload: { type: String, required: true },
    delivered: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const WebhookLog = model<IWebhookLog>("WebhookLog", webhookLogSchema);

export default WebhookLog;
