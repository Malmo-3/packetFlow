//* Defines the controllers (request handlers) for trip operations.

import { Request, Response } from "express";
import mongoose from "mongoose";
import { Trip } from "../models/Trip";
import { Delivery } from "../models/Delivery";

// Shape of the JSON body expected when creating a trip
type CreateTripBody = {
  name: string;
  region?: string;
  startCity: string;
  endCity: string;
  stops?: string[];
  assignedCarrier?: string;
  status?: "planned" | "active" | "completed";
};

// POST /trips -> create a new trip
export const createTrip = async (
  req: Request<{}, {}, CreateTripBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, region, startCity, endCity, stops, assignedCarrier, status } =
      req.body;

    // Reject the request early if required fields are missing
    if (!name || !startCity || !endCity) {
      res.status(400).json({
        message: "name, startCity, and endCity are required",
      });
      return;
    }

    // Persist the trip with sensible defaults for optional fields
    const trip = await Trip.create({
      name,
      region: region || "Skåne",
      startCity,
      endCity,
      stops: stops || [],
      assignedCarrier,
      status: status || "planned",
    });

    res.status(201).json(trip); // 201 Created
  } catch (error) {
    res.status(500).json({
      message: "Failed to create trip",
      error,
    });
  }
};

// GET /trips -> fetch all trips, newest first
export const getAllTrips = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 }); // -1 = descending
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch trips",
      error,
    });
  }
};

// GET /trips/:id -> fetch a single trip by id
export const getTripById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Guard: avoid CastError by checking the id format before querying Mongo
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid trip id" });
      return;
    }

    const trip = await Trip.findById(id);

    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch trip",
      error,
    });
  }
};

// PUT /trips/:id -> update an existing trip with the provided fields
export const updateTrip = async (
  req: Request<{ id: string }, {}, Partial<CreateTripBody>>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid trip id" });
      return;
    }

    // new: true -> return the updated doc; runValidators -> re-run schema validation
    const updatedTrip = await Trip.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTrip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update trip",
      error,
    });
  }
};

// DELETE /trips/:id -> delete a trip and detach any deliveries that referenced it
export const deleteTrip = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid trip id" });
      return;
    }

    const deletedTrip = await Trip.findByIdAndDelete(id);

    if (!deletedTrip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    // Cleanup: deliveries that pointed to this trip lose the reference
    // and are reset back to "pending" so they can be reassigned
    await Delivery.updateMany(
      { trip: id },
      {
        $unset: { trip: 1 }, // remove the trip field
        $set: { status: "pending" }, // reset status
      }
    );

    res.status(200).json({
      message: "Trip deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete trip",
      error,
    });
  }
};

// GET /trips/:id/deliveries -> list all deliveries assigned to a given trip
export const getDeliveriesForTrip = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid trip id" });
      return;
    }

    // Confirm the trip exists before returning a (possibly empty) deliveries list
    const trip = await Trip.findById(id);

    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const deliveries = await Delivery.find({ trip: id })
      .populate("trip") // include the full Trip doc on each delivery
      .sort({ createdAt: -1 });

    res.status(200).json(deliveries);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch deliveries for trip",
      error,
    });
  }
};
