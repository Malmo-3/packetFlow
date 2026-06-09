/**
 * Trip controller.
 *
 * Responses are returned RAW (no { success, data } envelope) to match
 * @packetflow/backend-client → trips.ts, which casts responses directly to
 * BackendTrip / BackendTrip[].
 *
 * Access (enforced on the routes):
 * - create / update / delete / assignDeliveries — admin
 * - getAll / getById                            — any authenticated user
 * - getMyTrips / updateTripStatus               — carrier (own trips)
 *
 * Cities are Skåne-validated by the request schema.
 */

import type { NextFunction, Request, Response } from "express";
import Trip from "../models/trip.model";
import { Delivery } from "../models/delivery.model";
import Checkpoint from "../models/checkpoint.model";
import NotFoundError from "../errors/NotFoundError";
import ForbiddenError from "../errors/ForbiddenError";
import BadRequestError from "../errors/BadRequestError";
import { TRIP_STATUSES, type TripStatus } from "../shared/skane";
import type {
  AssignDeliveriesToTripInput,
  CreateTripInput,
  TripIdParams,
  UpdateTripInput,
  UpdateTripStatusInput,
} from "../schemas/trip.schemas";

export const createTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.validatedBody as CreateTripInput;
    const trip = await Trip.create({
      ...body,
      region: body.region || "Skåne",
      stops: body.stops || [],
      status: body.status || "planned",
    });
    res.status(201).json(trip);
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
    res.status(200).json(trips);
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
    if (!trip) return next(new NotFoundError("Trip not found"));
    res.status(200).json(trip);
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
    const body = req.validatedBody as UpdateTripInput;
    const updatedTrip = await Trip.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!updatedTrip) return next(new NotFoundError("Trip not found"));
    res.status(200).json(updatedTrip);
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
    if (!deletedTrip) return next(new NotFoundError("Trip not found"));

    // Detach deliveries that pointed to this trip and reset them to pending.
    await Delivery.updateMany(
      { trip: id },
      { $unset: { trip: 1 }, $set: { status: "pending" } },
    );

    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// GET /trips/my — carrier's own trips.
export const getMyTrips = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const trips = await Trip.find({ assignedCarrier: req.user!.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(trips);
  } catch (error) {
    next(error);
  }
};

// PATCH /trips/:id/status — carrier advances status forward, own trips only.
export const updateTripStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as TripIdParams;
    const { status } = req.validatedBody as UpdateTripStatusInput;

    const trip = await Trip.findById(id);
    if (!trip) return next(new NotFoundError("Trip not found"));

    if (trip.assignedCarrier?.toString() !== req.user!.userId) {
      return next(new ForbiddenError("You are not assigned to this trip"));
    }

    const currentIdx = TRIP_STATUSES.indexOf(trip.status as TripStatus);
    const nextIdx = TRIP_STATUSES.indexOf(status);
    if (nextIdx <= currentIdx) {
      return next(
        new BadRequestError(
          `Cannot move status from "${trip.status}" to "${status}". Status can only move forward.`,
        ),
      );
    }

    trip.status = status;
    await trip.save();
    res.status(200).json(trip);
  } catch (error) {
    next(error);
  }
};

// GET /trips/:id/deliveries
export const getDeliveriesForTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as TripIdParams;
    const trip = await Trip.findById(id);
    if (!trip) return next(new NotFoundError("Trip not found"));

    const deliveries = await Delivery.find({ trip: id })
      .populate("trip")
      .sort({ createdAt: -1 });
    res.status(200).json(deliveries);
  } catch (error) {
    next(error);
  }
};

/** Great-circle distance (km) between two GPS points. */
const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// PATCH /trips/:id/optimize — order this trip's checkpoints into an efficient
// stop sequence (nearest-neighbour over GPS) and persist stopOrder. Admin.
export const optimizeTripStops = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as TripIdParams;

    const trip = await Trip.findById(id);
    if (!trip) return next(new NotFoundError("Trip not found"));

    const checkpoints = await Checkpoint.find({ trip: id });
    if (checkpoints.length === 0) {
      res.status(200).json([]);
      return;
    }

    // Start from the current first stop (lowest stopOrder), then greedily visit
    // the nearest unvisited checkpoint by GPS distance.
    const remaining = [...checkpoints].sort(
      (a, b) => (a.stopOrder ?? Infinity) - (b.stopOrder ?? Infinity),
    );
    const ordered = [remaining.shift()!];

    while (remaining.length > 0) {
      const current = ordered[ordered.length - 1];
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < remaining.length; i += 1) {
        const d = haversineKm(
          current.latitude,
          current.longitude,
          remaining[i].latitude,
          remaining[i].longitude,
        );
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }
      ordered.push(remaining.splice(nearestIdx, 1)[0]);
    }

    await Promise.all(
      ordered.map((cp, index) =>
        Checkpoint.findByIdAndUpdate(cp._id, { stopOrder: index + 1 }),
      ),
    );

    const result = await Checkpoint.find({ trip: id }).sort({ stopOrder: 1 });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// PATCH /trips/:id/deliveries — bulk-assign deliveries to this trip (admin).
export const assignDeliveriesToTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id: tripId } = req.validatedParams as TripIdParams;
    const { deliveryIds } = req.validatedBody as AssignDeliveriesToTripInput;

    const trip = await Trip.findById(tripId);
    if (!trip) return next(new NotFoundError("Trip not found"));

    const result = await Delivery.updateMany(
      { _id: { $in: deliveryIds } },
      { $set: { trip: tripId, status: "assigned" } },
    );

    res.status(200).json({
      message: "Deliveries assigned to trip successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};
