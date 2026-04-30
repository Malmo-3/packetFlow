//* Defines what a package looks like ..

import { Schema, model, Types } from "mongoose"; 

export interface IPackage {
  trackingNumber: string;
  senderName: string;
  recipientName: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  delivery?: Types.ObjectId;
  status: "registered" | "assigned" | "in_transit" | "delivered";
}

const packageSchema = new Schema<IPackage>(
  {
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
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    dimensions: {
      length: {
        type: Number,
        required: true,
        min: 0,
      },
      width: {
        type: Number,
        required: true,
        min: 0,
      },
      height: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    delivery: {
      type: Schema.Types.ObjectId, // stores a Delivery _id
      ref: "Delivery", // enables .populate("delivery") to load the related Delivery
      required: false, // a package can exist before being added to a delivery
    },
    status: {
      type: String,
      enum: ["registered", "assigned", "in_transit", "delivered"],
      default: "registered",
    },
  },
  {
    timestamps: true,
  },
);

const Package = model<IPackage>("Package", packageSchema);

export default Package;
