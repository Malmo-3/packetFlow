// Defines the schema and model for a delivery.

import { Schema, model, Document, Types } from "mongoose";


export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "cancelled";


export interface IDelivery extends Document {
  package: Types.ObjectId; // the Package this delivery is for
  trackingNumber: string;  // copied from the Package at creation time
  senderName: string;
  recipientName: string;
  pickupCity: string;
  destinationCity: string;
  deliveryAddress: string;
  trip?: Types.ObjectId;
  status: DeliveryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const deliverySchema = new Schema<IDelivery>(
  {
    package: {
      type: Schema.Types.ObjectId, // stores a Package _id
      ref: "Package",              // enables .populate("package")
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
      type: Schema.Types.ObjectId, // stores a Trip _id
      ref: "Trip", // enables .populate("trip") to load the related Trip
      required: false, // a delivery can exist before being assigned to a trip
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_transit", "delivered", "cancelled"], 
      default: "pending", 
    },
  },
  { timestamps: true } 
);


export const Delivery = model<IDelivery>("Delivery", deliverySchema);
