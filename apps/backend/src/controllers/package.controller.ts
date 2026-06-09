/**
 * Package controller — CRUD, carrier transitions, and notifications.
 *
 * Ownership model (the authorization fixes):
 * - createPackage     — public (optionalAuth) or authenticated sender
 * - getAllPackages    — results are scoped by role server-side
 * - getPackageById    — caller must be allowed to see THIS package (no IDOR)
 * - updatePackageById — admin (any field) or carrier (status only, forward-only,
 *                       and only on packages from one of the carrier's trips)
 * - deletePackageById — admin only (enforced on the route)
 * - arriveAtDropOff / markPickedUp — carrier only, own packages
 *
 * Cities are validated to Skåne municipalities by the request schema; the
 * drop-off / pick-up depots are resolved server-side from those cities.
 */

import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import Package from "../models/package.model";
import Trip from "../models/trip.model";
import { Delivery } from "../models/delivery.model";
import { Notification, type NotificationType } from "../models/notification.model";
import User from "../models/user.model";
import { DROP_OFF_POINTS } from "../shared/skane";
import NotFoundError from "../errors/NotFoundError";
import ForbiddenError from "../errors/ForbiddenError";
import ConflictError from "../errors/ConflictError";
import BadRequestError from "../errors/BadRequestError";
import { dispatchPackageStatusWebhooks } from "../utils/webhookDispatch";
import type { PackageStatus } from "../shared/skane";
import type {
  CreatePackageInput,
  PackageIdParams,
  UpdatePackageInput,
} from "../schemas/package.schemas";

/** Fire status-change webhooks for a package (best-effort). */
const fireStatusWebhooks = (pkg: {
  _id: unknown;
  status: PackageStatus;
  trackingNumber: string;
}) =>
  dispatchPackageStatusWebhooks({
    status: pkg.status,
    packageId: String(pkg._id),
    trackingNumber: pkg.trackingNumber,
  });

const POPULATE_DELIVERY_TRIP = {
  path: "delivery",
  populate: { path: "trip" },
} as const;

/** Collision-resistant tracking number in `PKT-XXXXXXXX` format. */
const generateTrackingNumber = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = crypto
    .randomBytes(8)
    .reduce((acc, byte) => acc + chars[byte % chars.length], "");
  return `PKT-${random}`;
};

const STATUS_LABELS: Record<string, string> = {
  registered: "registered",
  assigned: "assigned to a carrier",
  in_transit: "in transit",
  out_for_delivery: "out for delivery",
  delivered: "delivered",
  exception: "on hold (exception)",
};

const isMongoDuplicateKeyError = (error: unknown): error is { code: number } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code: unknown }).code === 11000;

/**
 * Create a notification for a user identified by email or User._id, but only if
 * that identity maps to a registered account. Silently skips otherwise.
 */
async function notifyUserIfExists(
  emailOrUserId: string | mongoose.Types.ObjectId,
  data: {
    type: NotificationType;
    packageId: mongoose.Types.ObjectId;
    trackingNumber: string;
    message: string;
  },
): Promise<void> {
  let userId: mongoose.Types.ObjectId | null = null;

  if (typeof emailOrUserId === "string" && emailOrUserId.includes("@")) {
    const user = await User.findOne({ email: emailOrUserId.toLowerCase() });
    if (user) userId = user._id as mongoose.Types.ObjectId;
  } else if (emailOrUserId instanceof mongoose.Types.ObjectId) {
    userId = emailOrUserId;
  } else if (mongoose.Types.ObjectId.isValid(emailOrUserId as string)) {
    userId = new mongoose.Types.ObjectId(emailOrUserId as string);
  }

  if (userId) {
    await Notification.create({ userId, ...data });
  }
}

/** The assignedCarrier id for a package whose `delivery.trip` is populated. */
function carrierIdForPopulatedPackage(pkg: unknown): string | undefined {
  const delivery = (pkg as { delivery?: unknown }).delivery as
    | { trip?: { assignedCarrier?: mongoose.Types.ObjectId } }
    | null
    | undefined;
  return delivery?.trip?.assignedCarrier?.toString();
}

/** Can this caller view/act on this (delivery+trip populated) package? */
function canAccessPackage(
  user: { userId: string; email: string; role: string },
  pkg: {
    senderId?: mongoose.Types.ObjectId;
    recipientEmail: string;
  },
  populatedPkg: unknown,
): boolean {
  switch (user.role) {
    case "admin":
      return true;
    case "sender":
      return pkg.senderId?.toString() === user.userId;
    case "recipient":
      return pkg.recipientEmail?.toLowerCase() === user.email?.toLowerCase();
    case "carrier":
      return carrierIdForPopulatedPackage(populatedPkg) === user.userId;
    default:
      return false;
  }
}

// POST /packages
export const createPackage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.validatedBody as CreatePackageInput;

    const trackingNumber = generateTrackingNumber();
    const dropOffPoint = DROP_OFF_POINTS[body.pickupCity];
    const pickUpPoint = DROP_OFF_POINTS[body.destinationCity];
    const senderId = req.user?.userId;

    const newPackage = await Package.create({
      ...body,
      trackingNumber,
      dropOffPoint,
      pickUpPoint,
      senderId,
    });

    await notifyUserIfExists(newPackage.recipientEmail, {
      type: "package_registered",
      packageId: newPackage._id as mongoose.Types.ObjectId,
      trackingNumber: newPackage.trackingNumber,
      message: `A package ${newPackage.trackingNumber} from ${newPackage.senderName} has been registered for you. Collect it at ${newPackage.pickUpPoint} in ${newPackage.destinationCity}.`,
    });

    await fireStatusWebhooks(newPackage);

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: newPackage,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) return next(error);
    if (isMongoDuplicateKeyError(error)) {
      return next(new ConflictError("Tracking number already exists"));
    }
    next(error);
  }
};

// GET /packages — role-scoped list (fixes the "everything to everyone" leak).
export const getAllPackages = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user!; // route is behind authMiddleware
    let filter: mongoose.FilterQuery<typeof Package> = {};

    if (user.role === "sender") {
      filter = { senderId: user.userId };
    } else if (user.role === "recipient") {
      filter = { recipientEmail: user.email?.toLowerCase() };
    } else if (user.role === "carrier") {
      const carrierTrips = await Trip.find({
        assignedCarrier: user.userId,
      }).select("_id");
      const tripIds = carrierTrips.map((t) => t._id);
      const carrierDeliveries = await Delivery.find({
        trip: { $in: tripIds },
      }).select("_id");
      const deliveryIds = carrierDeliveries.map((d) => d._id);
      filter = { delivery: { $in: deliveryIds } };
    }
    // admin → no filter (all packages)

    const packages = await Package.find(filter).populate(POPULATE_DELIVERY_TRIP);

    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
};

// GET /packages/:id — with ownership check (fixes IDOR).
export const getPackageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as PackageIdParams;

    const singlePackage = await Package.findById(id).populate(
      POPULATE_DELIVERY_TRIP,
    );

    if (!singlePackage) {
      return next(new NotFoundError("Package not found"));
    }

    if (!canAccessPackage(req.user!, singlePackage, singlePackage)) {
      return next(
        new ForbiddenError("You are not allowed to view this package"),
      );
    }

    res.status(200).json({ success: true, data: singlePackage });
  } catch (error) {
    next(error);
  }
};

const CARRIER_STATUS_ORDER = [
  "registered",
  "in_transit",
  "out_for_delivery",
  "delivered",
] as const;
type CarrierStatus = (typeof CARRIER_STATUS_ORDER)[number];

// PATCH /packages/:id
export const updatePackageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as PackageIdParams;
    const body = req.validatedBody as UpdatePackageInput;

    const pkg = await Package.findById(id).populate(POPULATE_DELIVERY_TRIP);
    if (!pkg) {
      return next(new NotFoundError("Package not found"));
    }

    // Carrier path — status only, forward-only, own packages.
    if (req.user!.role === "carrier") {
      if (carrierIdForPopulatedPackage(pkg) !== req.user!.userId) {
        return next(
          new ForbiddenError("You are not assigned to this package"),
        );
      }

      const status = body.status;
      if (!status) {
        return next(
          new BadRequestError("Carriers may only update the status field"),
        );
      }
      if (!CARRIER_STATUS_ORDER.includes(status as CarrierStatus)) {
        return next(new BadRequestError("Invalid status value for a carrier"));
      }

      const currentIdx = CARRIER_STATUS_ORDER.indexOf(
        pkg.status as CarrierStatus,
      );
      const nextIdx = CARRIER_STATUS_ORDER.indexOf(status as CarrierStatus);
      if (nextIdx <= currentIdx) {
        return next(
          new BadRequestError(
            `Cannot move status from "${pkg.status}" to "${status}". Status can only move forward.`,
          ),
        );
      }

      pkg.status = status as CarrierStatus;
      await pkg.save();

      await notifyUserIfExists(pkg.recipientEmail, {
        type: "status_updated",
        packageId: pkg._id as mongoose.Types.ObjectId,
        trackingNumber: pkg.trackingNumber,
        message: `Your package ${pkg.trackingNumber} is now ${
          STATUS_LABELS[pkg.status] ?? pkg.status
        }.`,
      });

      await fireStatusWebhooks(pkg);

      res
        .status(200)
        .json({ success: true, message: "Package updated successfully", data: pkg });
      return;
    }

    // Admin path — any field.
    const previousStatus = pkg.status;
    const updatedPackage = await Package.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (updatedPackage && updatedPackage.status !== previousStatus) {
      await notifyUserIfExists(updatedPackage.recipientEmail, {
        type: "status_updated",
        packageId: updatedPackage._id as mongoose.Types.ObjectId,
        trackingNumber: updatedPackage.trackingNumber,
        message: `Your package ${updatedPackage.trackingNumber} is now ${
          STATUS_LABELS[updatedPackage.status] ?? updatedPackage.status
        }.`,
      });
      await fireStatusWebhooks(updatedPackage);
    }

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: updatedPackage,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) return next(error);
    if (isMongoDuplicateKeyError(error)) {
      return next(new ConflictError("Tracking number already exists"));
    }
    next(error);
  }
};

// DELETE /packages/:id — admin only (route-enforced).
export const deletePackageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as PackageIdParams;

    const deletedPackage = await Package.findByIdAndDelete(id);
    if (!deletedPackage) {
      return next(new NotFoundError("Package not found"));
    }

    res.status(200).json({
      success: true,
      message: "Package deleted successfully",
      data: deletedPackage,
    });
  } catch (error) {
    next(error);
  }
};

// POST /packages/:id/arrive — carrier marks arrival at drop-off point.
export const arriveAtDropOff = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as PackageIdParams;

    const pkg = await Package.findById(id).populate(POPULATE_DELIVERY_TRIP);
    if (!pkg) {
      return next(new NotFoundError("Package not found"));
    }

    if (carrierIdForPopulatedPackage(pkg) !== req.user!.userId) {
      return next(new ForbiddenError("You are not assigned to this package"));
    }
    if (pkg.status === "delivered") {
      return next(new BadRequestError("Package has already been delivered"));
    }

    pkg.status = "out_for_delivery";
    await pkg.save();

    if (pkg.senderId) {
      await notifyUserIfExists(pkg.senderId, {
        type: "arrived_at_dropoff",
        packageId: pkg._id as mongoose.Types.ObjectId,
        trackingNumber: pkg.trackingNumber,
        message: `Your package ${pkg.trackingNumber} has arrived at the drop-off point: ${pkg.dropOffPoint}.`,
      });
    }
    await notifyUserIfExists(pkg.recipientEmail, {
      type: "arrived_at_dropoff",
      packageId: pkg._id as mongoose.Types.ObjectId,
      trackingNumber: pkg.trackingNumber,
      message: `Your package ${pkg.trackingNumber} is ready for collection at: ${pkg.pickUpPoint}.`,
    });

    await fireStatusWebhooks(pkg);

    res.status(200).json({
      success: true,
      message: "Arrival registered — sender and recipient notified",
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

// POST /packages/:id/pickup — carrier confirms recipient collected the package.
export const markPickedUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as PackageIdParams;

    const pkg = await Package.findById(id).populate(POPULATE_DELIVERY_TRIP);
    if (!pkg) {
      return next(new NotFoundError("Package not found"));
    }

    if (carrierIdForPopulatedPackage(pkg) !== req.user!.userId) {
      return next(new ForbiddenError("You are not assigned to this package"));
    }
    if (pkg.status !== "out_for_delivery") {
      return next(
        new BadRequestError(
          `Package must be out for delivery before pickup (current status: "${pkg.status}").`,
        ),
      );
    }

    pkg.status = "delivered";
    await pkg.save();

    if (pkg.senderId) {
      await notifyUserIfExists(pkg.senderId, {
        type: "package_picked_up",
        packageId: pkg._id as mongoose.Types.ObjectId,
        trackingNumber: pkg.trackingNumber,
        message: `Your package ${pkg.trackingNumber} has been collected by the recipient.`,
      });
    }
    await notifyUserIfExists(pkg.recipientEmail, {
      type: "package_picked_up",
      packageId: pkg._id as mongoose.Types.ObjectId,
      trackingNumber: pkg.trackingNumber,
      message: `Your package ${pkg.trackingNumber} has been marked as collected. Thank you for using PacketFlow.`,
    });

    await fireStatusWebhooks(pkg);

    res.status(200).json({
      success: true,
      message: "Package marked as picked up — sender and recipient notified",
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};
