/**
 * Carrier entity (placeholder).
 *
 * Spec data model "Carrier" — the transporter profile (vehicle/fleet, contact,
 * active flag). Optionally linked to the carrier's User account. This is a dummy
 * to be replaced/extended later; it intentionally stays minimal.
 *
 * Shape mirrors the web app's `Carrier` type: { id, name, vehicle, phone, active }.
 */

import { Schema, model, Types } from "mongoose";

export interface ICarrier {
  name: string;
  /** Human-readable vehicle / fleet-unit description. */
  vehicle: string;
  phone: string;
  active: boolean;
  /** Optional link to the carrier's User account (role: carrier). */
  user?: Types.ObjectId;
}

const carrierSchema = new Schema<ICarrier>(
  {
    name: { type: String, required: true, trim: true },
    vehicle: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true },
);

const Carrier = model<ICarrier>("Carrier", carrierSchema);

export default Carrier;
