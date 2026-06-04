//* Defines package scan records created by carrier flow.

import { Schema, Types, model } from "mongoose";
import { IPackage } from "./package.model";

export type ScanResult = "valid";

export interface IScanRecord {
  carrierId: string;
  tripId: Types.ObjectId;
  packageId: Types.ObjectId;
  scanCode: string;
  result: ScanResult;
  packageStatusAfter: IPackage["status"];
  scannedAt: Date;
}

const scanRecordSchema = new Schema<IScanRecord>(
  {
    carrierId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      required: true,
      index: true,
    },
    scanCode: {
      type: String,
      required: true,
      trim: true,
    },
    result: {
      type: String,
      enum: ["valid"],
      default: "valid",
    },
    packageStatusAfter: {
      type: String,
      enum: ["registered", "in_transit", "delivered"],
      required: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const ScanRecord = model<IScanRecord>("ScanRecord", scanRecordSchema);

export default ScanRecord;
