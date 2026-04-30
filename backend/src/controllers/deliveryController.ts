// Defines the controllers for deliveries.

import { Request, Response } from "express";
import mongoose from "mongoose";
import { Delivery, DeliveryStatus } from "../models/Delivery";
import { Trip } from "../models/Trip";

type CreateDeliveryBody = {
  trackingNumber: string;
  senderName: string;
  recipientName: string;
  pickupCity: string;
  destinationCity: string;
  deliveryAddress: string;
  trip?: string; // optional Trip _id (string form)
  status?: DeliveryStatus;
};


type AssignTripBody = {
  tripId: string;
};


type AssignManyBody = {
  tripId: string;
  deliveryIds: string[];
};

// POST /deliveries -> create a new delivery
export const createDelivery = async (
  req: Request<{}, {}, CreateDeliveryBody>,
  res: Response
): Promise<void> => {
  try {
    const {
      trackingNumber,
      senderName,
      recipientName,
      pickupCity,
      destinationCity,
      deliveryAddress,
      trip,
      status,
    } = req.body;

    // Validate that all required fields are present
    if (
      !trackingNumber ||
      !senderName ||
      !recipientName ||
      !pickupCity ||
      !destinationCity ||
      !deliveryAddress
    ) {
      res.status(400).json({
        message:
          "trackingNumber, senderName, recipientName, pickupCity, destinationCity, and deliveryAddress are required",
      });
      return;
    }

    // Validate trip & trip_id 
    if (trip) {
      if (!mongoose.Types.ObjectId.isValid(trip)) {
        res.status(400).json({ message: "Invalid trip id" });
        return;
      }

      const existingTrip = await Trip.findById(trip);
      if (!existingTrip) {
        res.status(404).json({ message: "Assigned trip not found" });
        return;
      }
    }

    // Auto-set status: if assigned to a trip on creation, mark as "assigned"
    const delivery = await Delivery.create({
      trackingNumber,
      senderName,
      recipientName,
      pickupCity,
      destinationCity,
      deliveryAddress,
      trip,
      status: trip ? "assigned" : status || "pending",
    });

    // Populate the trip reference so the client sees the full Trip object
    const populatedDelivery = await delivery.populate("trip");

    res.status(201).json(populatedDelivery); 
  } catch (error: any) {
    // 11000 = MongoDB duplicate key error -> trackingNumber must be unique
    if (error?.code === 11000) {
      res.status(409).json({
        message: "trackingNumber must be unique",
      });
      return;
    }

    res.status(500).json({
      message: "Failed to create delivery",
      error,
    });
  }
};

// GET /deliveries -> fetch all deliveries (newest first), trip populated
export const getAllDeliveries = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const deliveries = await Delivery.find()
      .populate("trip") // replace the trip ObjectId with the actual Trip doc
      .sort({ createdAt: -1 });

    res.status(200).json(deliveries);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch deliveries",
      error,
    });
  }
};

// GET /deliveries/:id -> fetch a single delivery by id
export const getDeliveryById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check bad ids before hitting the DB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid delivery id" });
      return;
    }

    const delivery = await Delivery.findById(id).populate("trip");

    if (!delivery) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }

    res.status(200).json(delivery);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch delivery",
      error,
    });
  }
};

// PUT /deliveries/:id -> update one or more fields of a delivery
export const updateDelivery = async (
  req: Request<{ id: string }, {}, Partial<CreateDeliveryBody>>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid delivery id" });
      return;
    }

    // If the update tries to attach a trip, verify it exists first
    if (req.body.trip) {
      if (!mongoose.Types.ObjectId.isValid(req.body.trip)) {
        res.status(400).json({ message: "Invalid trip id" });
        return;
      }

      const tripExists = await Trip.findById(req.body.trip);
      if (!tripExists) {
        res.status(404).json({ message: "Trip not found" });
        return;
      }
    }

    // new: true -> return the updated doc; runValidators -> re-run schema validation
    const updatedDelivery = await Delivery.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("trip");

    if (!updatedDelivery) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }

    res.status(200).json(updatedDelivery);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update delivery",
      error,
    });
  }
};

// DELETE /deliveries/:id -> delete a delivery
export const deleteDelivery = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid delivery id" });
      return;
    }

    const deletedDelivery = await Delivery.findByIdAndDelete(id);

    if (!deletedDelivery) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }

    res.status(200).json({
      message: "Delivery deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete delivery",
      error,
    });
  }
};

// PUT /deliveries/:id/assign-trip -> attach a trip to ONE delivery
export const assignTripToDelivery = async (
  req: Request<{ id: string }, {}, AssignTripBody>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // delivery id from the URL
    const { tripId } = req.body; // trip id from the body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid delivery id" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      res.status(400).json({ message: "Invalid trip id" });
      return;
    }

    // Confirm the trip we want to attach actually exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    // Update the delivery: set its trip reference and bump the status
    const updatedDelivery = await Delivery.findByIdAndUpdate(
      id,
      {
        trip: tripId,
        status: "assigned",
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("trip");

    if (!updatedDelivery) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }

    res.status(200).json(updatedDelivery);
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign trip to delivery",
      error,
    });
  }
};

// PUT /deliveries/assign-many/to-trip -> attach ONE trip to MANY deliveries in a single call
export const assignManyDeliveriesToTrip = async (
  req: Request<{}, {}, AssignManyBody>,
  res: Response
): Promise<void> => {
  try {
    const { tripId, deliveryIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      res.status(400).json({ message: "Invalid trip id" });
      return;
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    // deliveryIds must be a non-empty array
    if (!Array.isArray(deliveryIds) || deliveryIds.length === 0) {
      res.status(400).json({
        message: "deliveryIds must be a non-empty array",
      });
      return;
    }

    // Catch the first invalid id so the client gets a clear error message
    const invalidId = deliveryIds.find(
      (deliveryId) => !mongoose.Types.ObjectId.isValid(deliveryId)
    );

    if (invalidId) {
      res.status(400).json({
        message: `Invalid delivery id: ${invalidId}`,
      });
      return;
    }

    // $in: match any delivery whose _id is in the provided list
    // $set: same trip + status applied to all matched docs
    const result = await Delivery.updateMany(
      { _id: { $in: deliveryIds } },
      {
        $set: {
          trip: tripId,
          status: "assigned",
        },
      }
    );

    res.status(200).json({
      message: "Deliveries assigned to trip successfully",
      matchedCount: result.matchedCount, // how many docs matched the filter
      modifiedCount: result.modifiedCount, // how many docs were actually changed
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign deliveries to trip",
      error,
    });
  }
};

// GET /deliveries/unassigned -> list deliveries that have no trip and are still pending
export const getUnassignedDeliveries = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // $or matches docs where the trip field is missing OR explicitly null
    const deliveries = await Delivery.find({
      $or: [{ trip: { $exists: false } }, { trip: null }],
      status: "pending",
    }).sort({ createdAt: -1 });

    res.status(200).json(deliveries);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch unassigned deliveries",
      error,
    });
  }
};
