/**
 * Package Mongoose model.
 *
 * The Package is the central entity — created by a sender (or via the public
 * intake form), then linked to a Delivery when an admin assigns a carrier.
 *
 * Contract notes (must stay aligned with @packetflow/backend-client → BackendPackage):
 * - `trackingNumber` is unique and auto-generated server-side (`PKT-XXXXXXXX`).
 * - `recipientEmail` is required — used to target in-app notifications.
 * - `dropOffPoint` / `pickUpPoint` are resolved server-side from the cities and
 *   are never accepted from the client.
 * - `senderId` is optional so the public (unauthenticated) intake form works.
 */

import { Schema, model, Types } from "mongoose";
import type { PackageStatus } from "../shared/skane";
import { PACKAGE_STATUSES } from "../shared/skane";

export interface IPackage {
  trackingNumber: string;
  /** User._id of the authenticated sender. Optional — anonymous submissions allowed. */
  senderId?: Types.ObjectId;
  senderName: string;
  recipientName: string;
  /** Used to look up the recipient's account when sending notifications. */
  recipientEmail: string;
  recipientPhone?: string;
  recipientAddress?: string;
  /** Origin city — a valid Skåne municipality (validated by the request schema). */
  pickupCity: string;
  /** Destination city — a valid Skåne municipality. */
  destinationCity: string;
  /** Depot in the origin city — where the sender leaves the package. */
  dropOffPoint: string;
  /** Depot in the destination city — where the recipient collects the package. */
  pickUpPoint: string;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  /** Populated once a carrier is assigned (links to the Delivery document). */
  delivery?: Types.ObjectId;
  status: PackageStatus;
  /** Set when PII on this record has been anonymized by the GDPR retention job. */
  anonymizedAt?: Date;
}

const packageSchema = new Schema<IPackage>(
  {
    trackingNumber: { type: String, required: true, unique: true, trim: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    senderName: { type: String, required: true, trim: true },
    recipientName: { type: String, required: true, trim: true },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    recipientPhone: { type: String, trim: true, required: false },
    recipientAddress: { type: String, trim: true, required: false },
    pickupCity: { type: String, required: true, trim: true },
    destinationCity: { type: String, required: true, trim: true },
    dropOffPoint: { type: String, required: true, trim: true },
    pickUpPoint: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 0 },
    dimensions: {
      length: { type: Number, required: true, min: 0 },
      width: { type: Number, required: true, min: 0 },
      height: { type: Number, required: true, min: 0 },
    },
    delivery: { type: Schema.Types.ObjectId, ref: "Delivery", required: false },
    status: {
      type: String,
      enum: [...PACKAGE_STATUSES],
      default: "registered",
    },
    anonymizedAt: { type: Date, required: false },
  },
  { timestamps: true },
);

const Package = model<IPackage>("Package", packageSchema);

export default Package;
