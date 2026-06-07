import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { Delivery } from "../models/delivery.model";
import Package from "../models/package.model";
import Trip from "../models/trip.model";
import ConflictError from "../errors/ConflictError";
import NotFoundError from "../errors/NotFoundError";
import type {
  AssignManyDeliveriesToTripInput,
  AssignTripToDeliveryInput,
  CreateDeliveryInput,
  DeliveryIdParams,
  UpdateDeliveryInput,
} from "../schemas/delivery.schemas";

const isMongoDuplicateKeyError = (
  error: unknown,
): error is { code: number } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
};

export const createDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { packageId, trip, status } =
      req.validatedBody as CreateDeliveryInput;

    const pkg = await Package.findById(packageId);

    if (!pkg) {
      next(new NotFoundError("Package not found"));
      return;
    }

    if (pkg.delivery) {
      next(new ConflictError("Package already has a delivery assigned"));
      return;
    }

    if (trip) {
      const existingTrip = await Trip.findById(trip);

      if (!existingTrip) {
        next(new NotFoundError("Assigned trip not found"));
        return;
      }
    }

    const delivery = await Delivery.create({
      package: packageId,
      trackingNumber: pkg.trackingNumber,
      senderName: pkg.senderName,
      recipientName: pkg.recipientName,
      pickupCity: pkg.pickupCity,
      destinationCity: pkg.destinationCity,
      deliveryAddress: pkg.deliveryAddress,
      trip,
      status: trip ? "assigned" : status || "pending",
    });

    await Package.findByIdAndUpdate(packageId, {
      delivery: delivery._id,
      status: "assigned",
    });

    const populatedDelivery = await delivery.populate(["package", "trip"]);

    res.status(201).json({
      success: true,
      message: "Delivery created successfully",
      data: populatedDelivery,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      next(error);
      return;
    }

    if (isMongoDuplicateKeyError(error)) {
      next(
        new ConflictError(
          "A delivery with this tracking number already exists",
        ),
      );
      return;
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

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
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

    if (!delivery) {
      next(new NotFoundError("Delivery not found"));
      return;
    }

    res.status(200).json({
      success: true,
      data: delivery,
    });
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
    const validatedBody = req.validatedBody as UpdateDeliveryInput;

    if (validatedBody.trip) {
      const tripExists = await Trip.findById(validatedBody.trip);

      if (!tripExists) {
        next(new NotFoundError("Trip not found"));
        return;
      }
    }

    const updatedDelivery = await Delivery.findByIdAndUpdate(
      id,
      validatedBody,
      {
        new: true,
        runValidators: true,
      },
    ).populate("trip");

    if (!updatedDelivery) {
      next(new NotFoundError("Delivery not found"));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Delivery updated successfully",
      data: updatedDelivery,
    });
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

    if (!deletedDelivery) {
      next(new NotFoundError("Delivery not found"));
      return;
    }

    await Package.findByIdAndUpdate(deletedDelivery.package, {
      $unset: { delivery: 1 },
      $set: { status: "registered" },
    });

    res.status(200).json({
      success: true,
      message: "Delivery deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const assignTripToDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as DeliveryIdParams;
    const { tripId } = req.validatedBody as AssignTripToDeliveryInput;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      next(new NotFoundError("Trip not found"));
      return;
    }

    const updatedDelivery = await Delivery.findByIdAndUpdate(
      id,
      {
        trip: tripId,
        status: "assigned",
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("trip");

    if (!updatedDelivery) {
      next(new NotFoundError("Delivery not found"));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Trip assigned to delivery successfully",
      data: updatedDelivery,
    });
  } catch (error) {
    next(error);
  }
};

export const assignManyDeliveriesToTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { tripId, deliveryIds } =
      req.validatedBody as AssignManyDeliveriesToTripInput;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      next(new NotFoundError("Trip not found"));
      return;
    }

    const result = await Delivery.updateMany(
      { _id: { $in: deliveryIds } },
      {
        $set: {
          trip: tripId,
          status: "assigned",
        },
      },
    );

    res.status(200).json({
      success: true,
      message: "Deliveries assigned to trip successfully",
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

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

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
};
