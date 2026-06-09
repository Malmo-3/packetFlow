/**
 * Carrier application — submitted by a prospective carrier, approved by an admin.
 *
 * Self-registration can't grant the carrier role, so applicants submit here; on
 * approval an admin creates the carrier User (+ Carrier profile) from this record.
 * The chosen password is stored pre-hashed and reused at approval time.
 */

import { Schema, model } from "mongoose";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ICarrierApplication {
  fullName: string;
  email: string;
  phone: string;
  vehicle: string;
  address?: string;
  passwordHash: string;
  status: ApplicationStatus;
}

const carrierApplicationSchema = new Schema<ICarrierApplication>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    vehicle: { type: String, required: true, trim: true },
    address: { type: String, required: false, trim: true },
    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

const CarrierApplication = model<ICarrierApplication>(
  "CarrierApplication",
  carrierApplicationSchema,
);

export default CarrierApplication;
