/**
 * Delivery Mongoose model.
 *
 * A Delivery is created by an admin when assigning a carrier to a package. It
 * links a Package to a Trip and copies the shipment details from the package at
 * creation time (a self-contained snapshot).
 *
 * Two-way link:
 * - `Delivery.package` → Package._id
 * - `Package.delivery` → Delivery._id (stamped in createDelivery)
 *
 * Fields must stay aligned with @packetflow/backend-client → BackendDelivery.
 */

import { Schema, model, Types } from "mongoose";

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface IDelivery {
  package: Types.ObjectId;
  trackingNumber: string;
  senderName: string;
  recipientName: string;
  recipientEmail: string;
  pickupCity: string;
  destinationCity: string;
  dropOffPoint: string;
  trip?: Types.ObjectId;
  status: DeliveryStatus;
  anonymizedAt?: Date;
}

const deliverySchema = new Schema<IDelivery>(
  {
    package: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    trackingNumber: { type: String, required: true, unique: true, trim: true },
    senderName: { type: String, required: true, trim: true },
    recipientName: { type: String, required: true, trim: true },
    recipientEmail: { type: String, required: true, trim: true, lowercase: true },
    pickupCity: { type: String, required: true, trim: true },
    destinationCity: { type: String, required: true, trim: true },
    dropOffPoint: { type: String, required: true, trim: true },
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: false },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const Delivery = model<IDelivery>("Delivery", deliverySchema);

export default Delivery;
