import { Schema, Types, model } from "mongoose";
import type { IPackage } from "./package.model";

export type ScanResult = "valid" | "duplicate" | "exception";

export interface IScanRecord {
  carrier?: Types.ObjectId;
  trip?: Types.ObjectId;
  package: Types.ObjectId;
  checkpoint: Types.ObjectId;
  scanCode: string;
  result: ScanResult;
  packageStatusAfter: IPackage["status"];
  latitude: number;
  longitude: number;
  scannedAt: Date;
}

const scanRecordSchema = new Schema<IScanRecord>(
  {
    carrier: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: false,
      index: true,
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      required: true,
      index: true,
    },
    checkpoint: {
      type: Schema.Types.ObjectId,
      ref: "Checkpoint",
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
      enum: ["valid", "duplicate", "exception"],
      default: "valid",
    },
    packageStatusAfter: {
      type: String,
      enum: ["registered", "assigned", "in_transit", "delivered"],
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
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
