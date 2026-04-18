import { Schema, model } from "mongoose";

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
  status: "registered" | "in_transit" | "delivered";
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
    status: {
      type: String,
      enum: ["registered", "in_transit", "delivered"],
      default: "registered",
    },
  },
  {
    timestamps: true,
  },
);

const Package = model<IPackage>("Package", packageSchema);

export default Package;
