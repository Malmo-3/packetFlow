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
  pickupCity: string;
  destinationCity: string;
  deliveryAddress: string;
  trip?: Types.ObjectId;
  status: DeliveryStatus;
}

const deliverySchema = new Schema<IDelivery>(
  {
    package: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    pickupCity: {
      type: String,
      required: true,
      trim: true,
    },
    destinationCity: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

export const Delivery = model<IDelivery>("Delivery", deliverySchema);
