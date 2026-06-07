import type { NextFunction, Request, Response } from "express";
import ScanRecord from "../models/scanRecord.model";
import Package from "../models/package.model";
import Checkpoint from "../models/checkpoint.model";
import Trip from "../models/trip.model";
import User from "../models/user.model";
import NotFoundError from "../errors/NotFoundError";
import type {
  CreateScanRecordInput,
  PackageIdParams,
  ScanRecordIdParams,
} from "../schemas/scanRecord.schemas";
import { Delivery } from "../models/delivery.model";
import { sendWebhookEvent } from "../utils/sendWebhookEvent";

//
export const createScanRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedBody = req.validatedBody as CreateScanRecordInput;

    const pkg = await Package.findById(validatedBody.package);
    if (!pkg) {
      next(new NotFoundError("Package not found"));
      return;
    }

    const checkpoint = await Checkpoint.findById(validatedBody.checkpoint);
    if (!checkpoint) {
      next(new NotFoundError("Checkpoint not found"));
      return;
    }

    if (validatedBody.trip) {
      const trip = await Trip.findById(validatedBody.trip);
      if (!trip) {
        next(new NotFoundError("Trip not found"));
        return;
      }
    }

    if (validatedBody.carrier) {
      const carrier = await User.findById(validatedBody.carrier);
      if (!carrier) {
        next(new NotFoundError("Carrier not found"));
        return;
      }
    }

    const effectiveScannedAt = validatedBody.scannedAt || new Date();

    const scanRecord = await ScanRecord.create({
      ...validatedBody,
      result: validatedBody.result || "valid",
      scannedAt: effectiveScannedAt,
    });

    const deliveryStatusMap = {
      registered: "pending",
      assigned: "assigned",
      in_transit: "in_transit",
      delivered: "delivered",
    } as const;

    await Package.findByIdAndUpdate(validatedBody.package, {
      status: validatedBody.packageStatusAfter,
    });

    let updatedDelivery = null;

    if (pkg.delivery) {
      updatedDelivery = await Delivery.findByIdAndUpdate(
        pkg.delivery,
        {
          status: deliveryStatusMap[validatedBody.packageStatusAfter],
        },
        { new: true },
      );
    }

    await Promise.allSettled([
      sendWebhookEvent("scan.created", {
        scanId: scanRecord._id.toString(),
        trackingNumber: pkg.trackingNumber,
        packageId: pkg._id.toString(),
        checkpointId: validatedBody.checkpoint,
        tripId: validatedBody.trip ?? null,
        carrierId: validatedBody.carrier ?? null,
        scanCode: validatedBody.scanCode,
        result: validatedBody.result || "valid",
        packageStatusAfter: validatedBody.packageStatusAfter,
        latitude: validatedBody.latitude,
        longitude: validatedBody.longitude,
        scannedAt: effectiveScannedAt.toISOString(),
      }),
      sendWebhookEvent("package.status_changed", {
        packageId: pkg._id.toString(),
        trackingNumber: pkg.trackingNumber,
        status: validatedBody.packageStatusAfter,
      }),
      ...(updatedDelivery
        ? [
            sendWebhookEvent("delivery.status_changed", {
              deliveryId: updatedDelivery._id.toString(),
              packageId: pkg._id.toString(),
              trackingNumber: pkg.trackingNumber,
              status: deliveryStatusMap[validatedBody.packageStatusAfter],
            }),
          ]
        : []),
    ]);

    const populatedScanRecord = await scanRecord.populate([
      "package",
      "checkpoint",
      "trip",
      "carrier",
    ]);

    res.status(201).json({
      success: true,
      message: "Scan record created successfully",
      data: populatedScanRecord,
    });
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

    res.status(200).json({
      success: true,
      count: scanRecords.length,
      data: scanRecords,
    });
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

    if (!scanRecord) {
      next(new NotFoundError("Scan record not found"));
      return;
    }

    res.status(200).json({
      success: true,
      data: scanRecord,
    });
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
    if (!pkg) {
      next(new NotFoundError("Package not found"));
      return;
    }

    const scanHistory = await ScanRecord.find({ package: packageId })
      .populate(["checkpoint", "trip", "carrier"])
      .sort({ scannedAt: 1 });

    res.status(200).json({
      success: true,
      count: scanHistory.length,
      data: {
        package: pkg,
        history: scanHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};
