import { Schema, model, Types } from "mongoose";

export type TripStatus = "planned" | "active" | "completed";

export interface ITrip {
  name: string;
  region: string;
  startCity: string;
  endCity: string;
  stops: string[];
  assignedCarrier?: Types.ObjectId;
  status: TripStatus;
}

const tripSchema = new Schema<ITrip>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      default: "Skåne",
      trim: true,
    },
    startCity: {
      type: String,
      required: true,
      trim: true,
    },
    endCity: {
      type: String,
      required: true,
      trim: true,
    },
    stops: {
      type: [String],
      default: [],
    },
    assignedCarrier: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      enum: ["planned", "active", "completed"],
      default: "planned",
    },
  },
  {
    timestamps: true,
  },
);

const Trip = model<ITrip>("Trip", tripSchema);

export default Trip;
