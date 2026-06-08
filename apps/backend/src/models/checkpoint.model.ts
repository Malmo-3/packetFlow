import { Schema, model, Types } from "mongoose";

export type CheckpointType =
  | "warehouse"
  | "pickup"
  | "dropoff"
  | "sorting_center"
  | "custom";

export interface ICheckpoint {
  name: string;
  city: string;
  address: string;
  trip?: Types.ObjectId;
  stopOrder?: number;
  latitude: number;
  longitude: number;
  type: CheckpointType;
}

const checkpointSchema = new Schema<ICheckpoint>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: false,
    },
    stopOrder: {
      type: Number,
      required: false,
      min: 1,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["warehouse", "pickup", "dropoff", "sorting_center", "custom"],
      default: "custom",
    },
  },
  {
    timestamps: true,
  },
);

const Checkpoint = model<ICheckpoint>("Checkpoint", checkpointSchema);

export default Checkpoint;
