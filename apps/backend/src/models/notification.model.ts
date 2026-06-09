/**
 * Notification Mongoose model.
 *
 * In-app notifications are created server-side on package events and targeted at
 * a specific user by `userId`. The web app polls `GET /notifications`.
 * Fields must stay aligned with @packetflow/backend-client → BackendNotification.
 */

import { Schema, model, Types } from "mongoose";

export type NotificationType =
  | "package_registered"
  | "status_updated"
  | "arrived_at_dropoff"
  | "package_picked_up";

export interface INotification {
  userId: Types.ObjectId;
  type: NotificationType;
  packageId: Types.ObjectId;
  trackingNumber: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "package_registered",
        "status_updated",
        "arrived_at_dropoff",
        "package_picked_up",
      ],
      required: true,
    },
    packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    trackingNumber: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Fast lookup of a user's notifications, newest first.
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = model<INotification>(
  "Notification",
  notificationSchema,
);

export default Notification;
