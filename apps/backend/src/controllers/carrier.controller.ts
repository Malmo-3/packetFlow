/**
 * Carrier flow controllers for assigned trips and package scans.
 *
 * SECURITY: carrier identity comes from the authenticated JWT (`req.user.userId`),
 * NOT a client-supplied `x-carrier-id` header (which the previous version trusted
 * and anyone could spoof). All routes are behind `authMiddleware` + `permit("carrier")`.
 * Helpers throw typed errors that the controllers forward to the central handler.
 */

import type { NextFunction, Request, Response } from "express";
import mongoose, { type HydratedDocument } from "mongoose";
import { Delivery, type IDelivery } from "../models/delivery.model";
import Package, { type IPackage } from "../models/package.model";
import ScanRecord from "../models/scanRecord.model";
import Trip, { type ITrip } from "../models/trip.model";
import NotFoundError from "../errors/NotFoundError";
import BadRequestError from "../errors/BadRequestError";
import ConflictError from "../errors/ConflictError";
import { dispatchPackageStatusWebhooks } from "../utils/webhookDispatch";
import type {
  CarrierScanBody,
  CarrierTripParams,
} from "../schemas/carrier.schemas";

interface CarrierTripResult {
  carrierId: string;
  trip: HydratedDocument<ITrip>;
}

interface ValidCarrierScan extends CarrierTripResult {
  delivery: HydratedDocument<IDelivery>;
  packageId: string;
  scanCode: string;
  packageDoc: HydratedDocument<IPackage>;
}

const getCarrierTrip = async (req: Request): Promise<CarrierTripResult> => {
  const carrierId = req.user!.userId;
  const { tripId } = req.validatedParams as CarrierTripParams;

  const trip = await Trip.findOne({
    _id: tripId,
    assignedCarrier: new mongoose.Types.ObjectId(carrierId),
  });

  if (!trip) {
    throw new NotFoundError("Trip not found for carrier");
  }

  return { carrierId, trip };
};

const getDeliveriesForTrip = (tripId: string) => Delivery.find({ trip: tripId });

const getPackagesByDelivery = async (
  deliveries: HydratedDocument<IDelivery>[],
): Promise<Map<string, HydratedDocument<IPackage>>> => {
  const packageIds = deliveries.map((d) => d.package);
  const packages = await Package.find({ _id: { $in: packageIds } });
  return new Map(packages.map((p) => [p.id, p]));
};

const countRemainingDeliveries = async (tripId: string): Promise<number> => {
  const deliveries = await getDeliveriesForTrip(tripId);
  const packagesById = await getPackagesByDelivery(deliveries);
  return deliveries.filter((d) => {
    const pkg = packagesById.get(d.package.toString());
    return d.status !== "delivered" || pkg?.status !== "delivered";
  }).length;
};

const validateCarrierScan = async (req: Request): Promise<ValidCarrierScan> => {
  const carrierTrip = await getCarrierTrip(req);
  const { packageId, scanCode } = req.validatedBody as CarrierScanBody;

  const delivery = await Delivery.findOne({
    trip: carrierTrip.trip.id,
    package: packageId,
  });
  if (!delivery) {
    throw new BadRequestError("Package is not assigned to this trip");
  }

  const packageDoc = await Package.findById(packageId);
  if (!packageDoc) {
    throw new NotFoundError("Package not found");
  }

  if (packageDoc.trackingNumber !== scanCode) {
    throw new BadRequestError(
      "Invalid scan: scanCode does not match package trackingNumber",
    );
  }

  return { ...carrierTrip, delivery, packageId, scanCode, packageDoc };
};

// GET /carrier/trip — the carrier's current planned/active trip + its deliveries.
export const getAssignedTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const trip = await Trip.findOne({
      assignedCarrier: new mongoose.Types.ObjectId(req.user!.userId),
      status: { $in: ["planned", "active"] },
    }).sort({ createdAt: -1 });

    if (!trip) {
      return next(new NotFoundError("No planned or active trip found for carrier"));
    }

    const deliveries = await Delivery.find({ trip: trip.id }).populate("package");
    res.status(200).json({ success: true, data: { trip, deliveries } });
  } catch (error) {
    next(error);
  }
};

// GET /carrier/trips/:tripId/packages
export const getTripPackages = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const carrierTrip = await getCarrierTrip(req);
    const deliveries = await getDeliveriesForTrip(carrierTrip.trip.id);
    const packagesById = await getPackagesByDelivery(deliveries);

    const packages = deliveries
      .map((d) => packagesById.get(d.package.toString()))
      .filter((p): p is HydratedDocument<IPackage> => Boolean(p));

    res.status(200).json({ success: true, count: packages.length, data: packages });
  } catch (error) {
    next(error);
  }
};

// POST /carrier/trips/:tripId/scans/validate
export const validatePackageScan = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validScan = await validateCarrierScan(req);
    res.status(200).json({
      success: true,
      message: "Package scan is valid",
      data: {
        valid: true,
        tripId: validScan.trip.id,
        deliveryId: validScan.delivery.id,
        packageId: validScan.packageId,
        scanCode: validScan.scanCode,
        packageStatus: validScan.packageDoc.status,
        deliveryStatus: validScan.delivery.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /carrier/trips/:tripId/scans — record a delivery scan.
export const scanPackage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validScan = await validateCarrierScan(req);

    if (validScan.trip.status !== "active") {
      return next(
        new ConflictError("Trip must be checked in before scanning packages"),
      );
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      validScan.packageId,
      { status: "delivered" },
      { new: true, runValidators: true },
    );
    if (!updatedPackage) return next(new NotFoundError("Package not found"));

    const updatedDelivery = await Delivery.findByIdAndUpdate(
      validScan.delivery.id,
      { status: "delivered" },
      { new: true, runValidators: true },
    );
    if (!updatedDelivery) return next(new NotFoundError("Delivery not found"));

    const scanRecord = await ScanRecord.create({
      carrier: new mongoose.Types.ObjectId(validScan.carrierId),
      trip: new mongoose.Types.ObjectId(validScan.trip.id),
      package: new mongoose.Types.ObjectId(validScan.packageId),
      scanCode: validScan.scanCode,
      result: "valid",
      packageStatusAfter: "delivered",
      scannedAt: new Date(),
    });

    await dispatchPackageStatusWebhooks({
      status: "delivered",
      packageId: String(validScan.packageId),
      trackingNumber: updatedPackage.trackingNumber,
    });

    const remainingPackages = await countRemainingDeliveries(validScan.trip.id);

    res.status(201).json({
      success: true,
      message: "Package scan recorded successfully",
      data: {
        scanRecord,
        package: updatedPackage,
        delivery: updatedDelivery,
        tripStatus: validScan.trip.status,
        remainingPackages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /carrier/trips/:tripId/check-in
export const checkIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const carrierTrip = await getCarrierTrip(req);

    if (carrierTrip.trip.status !== "planned") {
      return next(
        new ConflictError("Trip can only be checked in when it is planned"),
      );
    }

    carrierTrip.trip.status = "active";
    await carrierTrip.trip.save();
    res.status(200).json({ success: true, message: "Checked in successfully", data: { trip: carrierTrip.trip } });
  } catch (error) {
    next(error);
  }
};

// PATCH /carrier/trips/:tripId/check-out  (also exported as endShift)
export const checkOut = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const carrierTrip = await getCarrierTrip(req);

    if (carrierTrip.trip.status !== "active") {
      return next(
        new ConflictError("Trip can only be checked out when it is active"),
      );
    }

    const remainingPackages = await countRemainingDeliveries(carrierTrip.trip.id);
    if (remainingPackages > 0) {
      return next(
        new ConflictError("Cannot end shift while deliveries are still unfinished"),
      );
    }

    carrierTrip.trip.status = "completed";
    await carrierTrip.trip.save();
    res.status(200).json({
      success: true,
      message: "Shift ended successfully",
      data: { trip: carrierTrip.trip, remainingPackages },
    });
  } catch (error) {
    next(error);
  }
};

export const endShift = checkOut;
