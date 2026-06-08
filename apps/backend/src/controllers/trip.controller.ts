import type { NextFunction, Request, Response } from "express";
import Trip from "../models/trip.model";
import { Delivery } from "../models/delivery.model";
import NotFoundError from "../errors/NotFoundError";
import type {
  AssignDeliveriesToTripInput,
  CreateTripInput,
  TripIdParams,
  UpdateTripInput,
} from "../schemas/trip.schemas";

export const createTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedBody = req.validatedBody as CreateTripInput;

    const trip = await Trip.create({
      ...validatedBody,
      region: validatedBody.region || "Skåne",
      stops: validatedBody.stops || [],
      status: validatedBody.status || "planned",
    });

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTrips = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    next(error);
  }
};

export const getTripById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as TripIdParams;

    const trip = await Trip.findById(id);

    if (!trip) {
      next(new NotFoundError("Trip not found"));
      return;
    }

    res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as TripIdParams;
    const validatedBody = req.validatedBody as UpdateTripInput;

    const updatedTrip = await Trip.findByIdAndUpdate(id, validatedBody, {
      new: true,
      runValidators: true,
    });

    if (!updatedTrip) {
      next(new NotFoundError("Trip not found"));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Trip updated successfully",
      data: updatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as TripIdParams;

    const deletedTrip = await Trip.findByIdAndDelete(id);

    if (!deletedTrip) {
      next(new NotFoundError("Trip not found"));
      return;
    }

    await Delivery.updateMany(
      { trip: id },
      {
        $unset: { trip: 1 },
        $set: { status: "pending" },
      },
    );

    res.status(200).json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveriesForTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as TripIdParams;

    const trip = await Trip.findById(id);

    if (!trip) {
      next(new NotFoundError("Trip not found"));
      return;
    }

    const deliveries = await Delivery.find({ trip: id })
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

export const assignDeliveriesToTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id: tripId } = req.validatedParams as TripIdParams;
    const { deliveryIds } = req.validatedBody as AssignDeliveriesToTripInput;

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
