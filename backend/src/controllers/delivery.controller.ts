// Defines the controllers for deliveries.

import { Request, Response } from "express";
import mongoose from "mongoose";
import { Delivery, DeliveryStatus } from "../models/delivery.model";
import Package from "../models/package.model";
import { Trip } from "../models/trip.model";

type CreateDeliveryBody = {
  packageId: string;  // all shipment details are inherited from the Package
  trip?: string;      // optional Trip _id (string form)
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
// The client sends a packageId; the server looks up the package and inherits its
// trackingNumber, senderName, and recipientName. Creating a delivery also writes
// the delivery's _id back to Package.delivery, completing the two-way link.
export const createDelivery = async (
  req: Request<{}, {}, CreateDeliveryBody>,
  res: Response
): Promise<void> => {
  try {
    const { packageId, trip, status } = req.body;

    // Validate required fields
    if (!packageId) {
      res.status(400).json({ message: "packageId is required" });
      return;
    }

    // Validate packageId format
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      res.status(400).json({ message: "Invalid package id" });
      return;
    }

    // Look up the package — we need its trackingNumber, senderName, and recipientName
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      res.status(404).json({ message: "Package not found" });
      return;
    }

    // Guard: a package can only belong to one delivery
    if (pkg.delivery) {
      res.status(409).json({ message: "Package already has a delivery assigned" });
      return;
    }

    // Validate trip if provided
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

    // Create the delivery — all fields inherited from the package
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

    // Write the delivery reference back to the package, completing the two-way link
    await Package.findByIdAndUpdate(packageId, {
      delivery: delivery._id,
      status: "assigned",
    });

    // Populate both references so the client sees full objects
    const populatedDelivery = await delivery.populate(["package", "trip"]);

    res.status(201).json(populatedDelivery);
  } catch (error: any) {
    // 11000 = MongoDB duplicate key — shouldn't happen since tracking numbers are
    // generated uniquely on the package, but kept as a safety net
    if (error?.code === 11000) {
      res.status(409).json({
        message: "A delivery with this tracking number already exists",
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
// Optional query param: ?tripId=<id> -> filter to only deliveries on that trip
export const getAllDeliveries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { tripId } = req.query;

    if (tripId) {
      if (!mongoose.Types.ObjectId.isValid(tripId as string)) {
        res.status(400).json({ message: "Invalid trip id" });
        return;
      }
    }

    const filter = tripId ? { trip: tripId } : {};

    const deliveries = await Delivery.find(filter)
      .populate("trip")
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

// PATCH /deliveries/:id -> update one or more fields of a delivery
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

// PATCH/deliveries/:id/assign-trip -> attach a trip to ONE delivery
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

// PATCH /deliveries/assign-many/to-trip -> attach ONE trip to MANY deliveries in a single call
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
