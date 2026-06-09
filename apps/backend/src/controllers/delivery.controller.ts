/**
 * Delivery controller.
 *
 * Responses are returned RAW to match @packetflow/backend-client → deliveries.ts.
 * All write operations are admin-only (enforced on the routes).
 */

import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { Delivery } from "../models/delivery.model";
import Package from "../models/package.model";
import Trip from "../models/trip.model";
import NotFoundError from "../errors/NotFoundError";
import ConflictError from "../errors/ConflictError";
import type {
  AssignTripToDeliveryInput,
  CreateDeliveryInput,
  DeliveryIdParams,
  UpdateDeliveryInput,
} from "../schemas/delivery.schemas";

const isMongoDuplicateKeyError = (error: unknown): error is { code: number } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code: unknown }).code === 11000;

export const createDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { packageId, trip, status } = req.validatedBody as CreateDeliveryInput;

    const pkg = await Package.findById(packageId);
    if (!pkg) return next(new NotFoundError("Package not found"));
    if (pkg.delivery) {
      return next(new ConflictError("Package already has a delivery assigned"));
    }

    if (trip) {
      const existingTrip = await Trip.findById(trip);
      if (!existingTrip) return next(new NotFoundError("Assigned trip not found"));
    }

    const delivery = await Delivery.create({
      package: packageId,
      trackingNumber: pkg.trackingNumber,
      senderName: pkg.senderName,
      recipientName: pkg.recipientName,
      recipientEmail: pkg.recipientEmail,
      pickupCity: pkg.pickupCity,
      destinationCity: pkg.destinationCity,
      dropOffPoint: pkg.dropOffPoint,
      trip,
      status: trip ? "assigned" : status || "pending",
    });

    await Package.findByIdAndUpdate(packageId, {
      delivery: delivery._id,
      status: "assigned",
    });

    const populated = await delivery.populate(["package", "trip"]);
    res.status(201).json(populated);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) return next(error);
    if (isMongoDuplicateKeyError(error)) {
      return next(
        new ConflictError("A delivery with this tracking number already exists"),
      );
    }
    next(error);
  }
};

export const getAllDeliveries = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tripId =
      typeof req.query.tripId === "string" ? req.query.tripId : undefined;
    const filter = tripId ? { trip: tripId } : {};

    const deliveries = await Delivery.find(filter)
      .populate("trip")
      .sort({ createdAt: -1 });
    res.status(200).json(deliveries);
  } catch (error) {
    next(error);
  }
};

// NOTE: registered before "/:id" so it isn't captured as a param.
export const getUnassignedDeliveries = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const deliveries = await Delivery.find({
      $or: [{ trip: { $exists: false } }, { trip: null }],
      status: "pending",
    }).sort({ createdAt: -1 });
    res.status(200).json(deliveries);
  } catch (error) {
    next(error);
  }
};

export const getDeliveryById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as DeliveryIdParams;
    const delivery = await Delivery.findById(id).populate("trip");
    if (!delivery) return next(new NotFoundError("Delivery not found"));
    res.status(200).json(delivery);
  } catch (error) {
    next(error);
  }
};

export const updateDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as DeliveryIdParams;
    const body = req.validatedBody as UpdateDeliveryInput;

    if (body.trip) {
      const tripExists = await Trip.findById(body.trip);
      if (!tripExists) return next(new NotFoundError("Trip not found"));
    }

    const updatedDelivery = await Delivery.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("trip");

    if (!updatedDelivery) return next(new NotFoundError("Delivery not found"));
    res.status(200).json(updatedDelivery);
  } catch (error) {
    next(error);
  }
};

export const deleteDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as DeliveryIdParams;
    const deletedDelivery = await Delivery.findByIdAndDelete(id);
    if (!deletedDelivery) return next(new NotFoundError("Delivery not found"));

    await Package.findByIdAndUpdate(deletedDelivery.package, {
      $unset: { delivery: 1 },
      $set: { status: "registered" },
    });

    res.status(200).json({ message: "Delivery deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// PATCH /deliveries/:id/assign-trip
export const assignTripToDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as DeliveryIdParams;
    const { tripId } = req.validatedBody as AssignTripToDeliveryInput;

    const trip = await Trip.findById(tripId);
    if (!trip) return next(new NotFoundError("Trip not found"));

    const updatedDelivery = await Delivery.findByIdAndUpdate(
      id,
      { trip: tripId, status: "assigned" },
      { new: true, runValidators: true },
    ).populate("trip");

    if (!updatedDelivery) return next(new NotFoundError("Delivery not found"));
    res.status(200).json(updatedDelivery);
  } catch (error) {
    next(error);
  }
};
