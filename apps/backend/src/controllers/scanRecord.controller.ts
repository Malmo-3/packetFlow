import type { NextFunction, Request, Response } from "express";
import ScanRecord from "../models/scanRecord.model";
import Package from "../models/package.model";
import Checkpoint from "../models/checkpoint.model";
import Trip from "../models/trip.model";
import User from "../models/user.model";
import { Delivery, type DeliveryStatus } from "../models/delivery.model";
import NotFoundError from "../errors/NotFoundError";
import { dispatchPackageStatusWebhooks } from "../utils/webhookDispatch";
import type { PackageStatus } from "../shared/skane";
import type {
  CreateScanRecordInput,
  PackageIdParams,
  ScanRecordIdParams,
} from "../schemas/scanRecord.schemas";

// Map a package status onto the corresponding delivery status.
const deliveryStatusMap: Record<PackageStatus, DeliveryStatus> = {
  registered: "pending",
  assigned: "assigned",
  in_transit: "in_transit",
  out_for_delivery: "in_transit",
  delivered: "delivered",
  exception: "cancelled",
};

export const createScanRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.validatedBody as CreateScanRecordInput;

    const pkg = await Package.findById(body.package);
    if (!pkg) return next(new NotFoundError("Package not found"));

    const checkpoint = await Checkpoint.findById(body.checkpoint);
    if (!checkpoint) return next(new NotFoundError("Checkpoint not found"));

    if (body.trip) {
      const trip = await Trip.findById(body.trip);
      if (!trip) return next(new NotFoundError("Trip not found"));
    }
    if (body.carrier) {
      const carrier = await User.findById(body.carrier);
      if (!carrier) return next(new NotFoundError("Carrier not found"));
    }

    const effectiveScannedAt = body.scannedAt || new Date();

    const scanRecord = await ScanRecord.create({
      ...body,
      result: body.result || "valid",
      scannedAt: effectiveScannedAt,
    });

    await Package.findByIdAndUpdate(body.package, {
      status: body.packageStatusAfter,
    });

    if (pkg.delivery) {
      await Delivery.findByIdAndUpdate(pkg.delivery, {
        status: deliveryStatusMap[body.packageStatusAfter],
      });
    }

    // Notify subscribers of the new package status (records WebhookLog entries).
    await dispatchPackageStatusWebhooks({
      status: body.packageStatusAfter,
      packageId: String(pkg._id),
      trackingNumber: pkg.trackingNumber,
      extra: {
        scanId: String(scanRecord._id),
        checkpointId: body.checkpoint,
        latitude: body.latitude,
        longitude: body.longitude,
        scannedAt: effectiveScannedAt.toISOString(),
      },
    });

    const populated = await scanRecord.populate([
      "package",
      "checkpoint",
      "trip",
      "carrier",
    ]);

    res.status(201).json({ success: true, message: "Scan record created successfully", data: populated });
  } catch (error) {
    next(error);
  }
};

export const getAllScanRecords = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const scanRecords = await ScanRecord.find()
      .populate(["package", "checkpoint", "trip", "carrier"])
      .sort({ scannedAt: -1 });
    res.status(200).json({ success: true, count: scanRecords.length, data: scanRecords });
  } catch (error) {
    next(error);
  }
};

export const getScanRecordById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as ScanRecordIdParams;
    const scanRecord = await ScanRecord.findById(id).populate([
      "package",
      "checkpoint",
      "trip",
      "carrier",
    ]);
    if (!scanRecord) return next(new NotFoundError("Scan record not found"));
    res.status(200).json({ success: true, data: scanRecord });
  } catch (error) {
    next(error);
  }
};

export const getScanHistoryForPackage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { packageId } = req.validatedParams as PackageIdParams;
    const pkg = await Package.findById(packageId);
    if (!pkg) return next(new NotFoundError("Package not found"));

    const history = await ScanRecord.find({ package: packageId })
      .populate(["checkpoint", "trip", "carrier"])
      .sort({ scannedAt: 1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: { package: pkg, history },
    });
  } catch (error) {
    next(error);
  }
};
