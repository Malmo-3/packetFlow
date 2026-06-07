import { Schema, model, Types } from "mongoose";

export type DeliveryEstimateStatus = "estimated" | "updated" | "expired";

export interface IDeliveryEstimate {
  package: Types.ObjectId;
  trip?: Types.ObjectId;
  estimatedDeliveryAt: Date;
  minHours: number;
  maxHours: number;
  status: DeliveryEstimateStatus;
  reason?: string;
}

const deliveryEstimateSchema = new Schema<IDeliveryEstimate>(
  {
    package: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      required: true,
      unique: true,
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: false,
    },
    estimatedDeliveryAt: {
      type: Date,
      required: true,
    },
    minHours: {
      type: Number,
      required: true,
      min: 0,
    },
    maxHours: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["estimated", "updated", "expired"],
      default: "estimated",
    },
    reason: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const DeliveryEstimate = model<IDeliveryEstimate>(
  "DeliveryEstimate",
  deliveryEstimateSchema,
);

export default DeliveryEstimate;
