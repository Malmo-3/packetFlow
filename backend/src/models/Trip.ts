//Defines the schema and model for a trip(route) for deliveries.

import { Schema, model, Document, Types } from "mongoose";

export type TripStatus = "planned" | "active" | "completed";


export interface ITrip extends Document {
  name: string; 
  region: string; 
  startCity: string; 
  endCity: string; 
  stops: string[]; 
  assignedCarrier?: Types.ObjectId; 
  status: TripStatus; 
  createdAt: Date; 
  updatedAt: Date; 
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
      type: Schema.Types.ObjectId, // stores a User _id
      ref: "User", // enables .populate("assignedCarrier") to load the related User
    },
    status: {
      type: String,
      enum: ["planned", "active", "completed"],
      default: "planned",
    },
  },
  { timestamps: true } 
);


export const Trip = model<ITrip>("Trip", tripSchema);
