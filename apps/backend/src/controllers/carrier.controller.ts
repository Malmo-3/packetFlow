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
import User from "../models/user.model";
import Carrier from "../models/carrier.model";
import { Notification, type NotificationType } from "../models/notification.model";
import NotFoundError from "../errors/NotFoundError";
import BadRequestError from "../errors/BadRequestError";
import ConflictError from "../errors/ConflictError";
import { dispatchPackageStatusWebhooks } from "../utils/webhookDispatch";
import { isSwedishPlate } from "../shared/skane";
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

    // In-app notifications: tell the recipient (and sender) it was delivered.
    const deliveredMessage = `Your package ${updatedPackage.trackingNumber} has been delivered.`;
    await notifyIfExists(updatedPackage.recipientEmail, {
      type: "package_picked_up",
      packageId: updatedPackage._id as mongoose.Types.ObjectId,
      trackingNumber: updatedPackage.trackingNumber,
      message: deliveredMessage,
    });
    if (updatedPackage.senderId) {
      await notifyIfExists(String(updatedPackage.senderId), {
        type: "package_picked_up",
        packageId: updatedPackage._id as mongoose.Types.ObjectId,
        trackingNumber: updatedPackage.trackingNumber,
        message: deliveredMessage,
      });
    }

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

// ---------------------------------------------------------------------------
// Shift lifecycle (carrier on/off duty)
// ---------------------------------------------------------------------------

/** Ordered list of cities the trip passes through: start → stops → end. */
const journeyOf = (trip: ITrip): string[] => [
  trip.startCity,
  ...(trip.stops ?? []),
  trip.endCity,
];

/** Notify a user (by email or id) if they map to a registered account. */
const notifyIfExists = async (
  emailOrId: string,
  data: { type: NotificationType; packageId: mongoose.Types.ObjectId; trackingNumber: string; message: string },
): Promise<void> => {
  let userId: mongoose.Types.ObjectId | null = null;
  if (emailOrId.includes("@")) {
    const user = await User.findOne({ email: emailOrId.toLowerCase() });
    if (user) userId = user._id as mongoose.Types.ObjectId;
  } else if (mongoose.Types.ObjectId.isValid(emailOrId)) {
    userId = new mongoose.Types.ObjectId(emailOrId);
  }
  if (userId) await Notification.create({ userId, ...data });
};

// GET /carrier/shift — current shift state + the carrier's assigned trip.
export const getShift = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    const trip = await Trip.findOne({
      assignedCarrier: new mongoose.Types.ObjectId(req.user!.userId),
      status: { $in: ["planned", "active"] },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        onShift: Boolean(user?.shiftStartedAt),
        shiftStartedAt: user?.shiftStartedAt ?? null,
        trip: trip ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /carrier/shift/start — carrier clocks in.
export const startShift = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { shiftStartedAt: new Date() },
      { new: true },
    );
    if (!user) return next(new NotFoundError("User not found"));
    res.status(200).json({ success: true, message: "Shift started", data: { shiftStartedAt: user.shiftStartedAt } });
  } catch (error) {
    next(error);
  }
};

// POST /carrier/shift/end — carrier clocks out (only when no active trip remains).
export const endShiftSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const activeTrip = await Trip.findOne({
      assignedCarrier: new mongoose.Types.ObjectId(req.user!.userId),
      status: "active",
    });
    if (activeTrip) {
      return next(new ConflictError("Finish your active trip before ending the shift"));
    }
    await User.findByIdAndUpdate(req.user!.userId, { shiftStartedAt: null });
    res.status(200).json({ success: true, message: "Shift ended" });
  } catch (error) {
    next(error);
  }
};

// POST /carrier/trips/:tripId/accept — carrier acknowledges an assigned trip.
export const acceptTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { trip } = await getCarrierTrip(req);
    if (trip.status !== "planned") {
      return next(new ConflictError("Only planned trips can be accepted"));
    }
    trip.accepted = true;
    await trip.save();
    res.status(200).json({ success: true, message: "Trip accepted", data: { trip } });
  } catch (error) {
    next(error);
  }
};

// POST /carrier/trips/:tripId/advance — move the carrier to the next city/stop.
// Updates the trip's currentStopIndex and notifies senders/recipients of every
// package on the trip so the whole app reflects the new position.
export const advanceTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { trip } = await getCarrierTrip(req);

    if (trip.status !== "active") {
      return next(new ConflictError("Start the trip before advancing through stops"));
    }

    const journey = journeyOf(trip);
    const lastIndex = journey.length - 1;
    if (trip.currentStopIndex >= lastIndex) {
      return next(new ConflictError("Trip is already at its final destination"));
    }

    trip.currentStopIndex += 1;
    await trip.save();
    const currentCity = journey[trip.currentStopIndex];

    // Notify everyone with a package on this trip about the new location.
    const deliveries = await getDeliveriesForTrip(trip.id);
    const packagesById = await getPackagesByDelivery(deliveries);
    await Promise.all(
      [...packagesById.values()].map(async (pkg) => {
        const message = `Your package ${pkg.trackingNumber} is now at ${currentCity}.`;
        await notifyIfExists(pkg.recipientEmail, {
          type: "status_updated",
          packageId: pkg._id as mongoose.Types.ObjectId,
          trackingNumber: pkg.trackingNumber,
          message,
        });
        if (pkg.senderId) {
          await notifyIfExists(String(pkg.senderId), {
            type: "status_updated",
            packageId: pkg._id as mongoose.Types.ObjectId,
            trackingNumber: pkg.trackingNumber,
            message,
          });
        }
      }),
    );

    res.status(200).json({
      success: true,
      message: `Advanced to ${currentCity}`,
      data: {
        trip,
        journey,
        currentCity,
        currentStopIndex: trip.currentStopIndex,
        atDestination: trip.currentStopIndex >= lastIndex,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Carrier self-service: profile, history, edit, delete
// ---------------------------------------------------------------------------

// GET /carrier/me — the carrier's own account + carrier profile.
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select("-password");
    if (!user) return next(new NotFoundError("User not found"));
    const carrier = await Carrier.findOne({ user: user._id });
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        carrierId: user.carrierId ?? null,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: carrier?.phone ?? null,
        vehicle: carrier?.vehicle ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /carrier/history — past + current trips with delivery counts.
export const getHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const trips = await Trip.find({
      assignedCarrier: new mongoose.Types.ObjectId(req.user!.userId),
    }).sort({ createdAt: -1 });

    const history = await Promise.all(
      trips.map(async (trip) => {
        const deliveries = await getDeliveriesForTrip(trip.id);
        const packagesById = await getPackagesByDelivery(deliveries);
        const packages = [...packagesById.values()];
        const deliveredCount = packages.filter((p) => p.status === "delivered").length;
        return {
          trip,
          totalPackages: packages.length,
          deliveredCount,
        };
      }),
    );

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

// PATCH /carrier/profile — update own name + carrier contact details.
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as { fullName?: string; phone?: string; vehicle?: string };

    const userUpdate: Record<string, unknown> = {};
    if (typeof body.fullName === "string" && body.fullName.trim()) {
      userUpdate.fullName = body.fullName.trim();
    }
    const user = await User.findByIdAndUpdate(req.user!.userId, userUpdate, {
      new: true,
    }).select("-password");
    if (!user) return next(new NotFoundError("User not found"));

    const carrierUpdate: Record<string, unknown> = {};
    if (typeof body.fullName === "string" && body.fullName.trim()) carrierUpdate.name = body.fullName.trim();
    if (typeof body.phone === "string" && body.phone.trim()) carrierUpdate.phone = body.phone.trim();
    if (typeof body.vehicle === "string" && body.vehicle.trim()) {
      if (!isSwedishPlate(body.vehicle)) {
        return next(new BadRequestError("Enter a valid Swedish registration number, e.g. ABC 12D or ABC 123"));
      }
      carrierUpdate.vehicle = body.vehicle.trim();
    }
    const carrier = await Carrier.findOneAndUpdate({ user: user._id }, carrierUpdate, { new: true });

    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: {
        id: user._id,
        carrierId: user.carrierId ?? null,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: carrier?.phone ?? null,
        vehicle: carrier?.vehicle ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /carrier/account — carrier removes their own account.
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const carrierId = req.user!.userId;

    const activeTrip = await Trip.findOne({
      assignedCarrier: new mongoose.Types.ObjectId(carrierId),
      status: "active",
    });
    if (activeTrip) {
      return next(new ConflictError("Finish your active trip before deleting your account"));
    }

    // Detach from any assigned trips, then remove the carrier profile + user.
    await Trip.updateMany(
      { assignedCarrier: carrierId },
      { $unset: { assignedCarrier: 1 } },
    );
    await Carrier.deleteOne({ user: carrierId });
    await User.findByIdAndDelete(carrierId);

    res.status(200).json({ success: true, message: "Account deleted" });
  } catch (error) {
    next(error);
  }
};
