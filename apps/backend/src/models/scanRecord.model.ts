import { Schema, Types, model } from "mongoose";
import type { PackageStatus } from "../shared/skane";
import { PACKAGE_STATUSES } from "../shared/skane";

export type ScanResult = "valid" | "duplicate" | "exception";

export interface IScanRecord {
  carrier?: Types.ObjectId;
  trip?: Types.ObjectId;
  package: Types.ObjectId;
  /** Optional — checkpoint scans set this; carrier delivery scans may not. */
  checkpoint?: Types.ObjectId;
  scanCode: string;
  result: ScanResult;
  packageStatusAfter: PackageStatus;
  latitude?: number;
  longitude?: number;
  scannedAt: Date;
}

const scanRecordSchema = new Schema<IScanRecord>(
  {
    carrier: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: false, index: true },
    package: { type: Schema.Types.ObjectId, ref: "Package", required: true, index: true },
    checkpoint: {
      type: Schema.Types.ObjectId,
      ref: "Checkpoint",
      required: false,
      index: true,
    },
    scanCode: { type: String, required: true, trim: true },
    result: {
      type: String,
      enum: ["valid", "duplicate", "exception"],
      default: "valid",
    },
    packageStatusAfter: {
      type: String,
      enum: [...PACKAGE_STATUSES],
      required: true,
    },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    scannedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const ScanRecord = model<IScanRecord>("ScanRecord", scanRecordSchema);

export default ScanRecord;
