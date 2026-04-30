//Logic for CRUD and assigning packages to deliveries.

import { Request, Response } from "express";
import mongoose from "mongoose";
import Package from "../models/package.model";
import { Delivery } from "../models/Delivery";

type AssignDeliveryBody = {
  deliveryId: string;
};

// POST /api/v1/packages -> create a new package
export const createPackage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const newPackage = await Package.create(req.body); 

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: newPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create package",
      error,
    });
  }
};

// GET /api/v1/packages -> fetch all packages (with their delivery + trip populated)
export const getAllPackages = async (
  _req: Request, // Express gives me a request object, but it will not be used.
  res: Response,
): Promise<void> => {
  try {
    // Nested populate: load the package's Delivery, AND inside it the Delivery's Trip
    const packages = await Package.find().populate({
      path: "delivery",
      populate: { path: "trip" },
    });

    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
      error,
    });
  }
};

// GET /api/v1/packages/:id -> fetch one package (with delivery + trip populated)
export const getPackageById = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params; // takes the id value from URL parameters ..

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
      return;
    }

    const singlePackage = await Package.findById(id).populate({
      path: "delivery",
      populate: { path: "trip" },
    });

    if (!singlePackage) {
      res.status(404).json({
        success: false,
        message: "Package not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: singlePackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch package",
      error,
    });
  }
};

// PATCH /api/v1/packages/:id -> update one or more fields of a package
export const updatePackageById = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
      return;
    }

    const updatedPackage = await Package.findByIdAndUpdate(id, req.body, {
      new: true, // without this mongoose will return the old document update.. with new: true it returns the update document..
      runValidators: true, // when updating, still validate the data against the schema.
    });

    if (!updatedPackage) {
      res.status(404).json({
        success: false,
        message: "Package not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: updatedPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update package",
      error,
    });
  }
};

// DELETE /api/v1/packages/:id -> delete a package
export const deletePackageById = async (
  req: Request<{ id: string }>, // request object (incoming data from client)
  res: Response, // response object (what you send back)
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
      return;
    }

    const deletedPackage = await Package.findByIdAndDelete(id);

    if (!deletedPackage) {
      res.status(404).json({
        success: false,
        message: "Package not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Package deleted successfully",
      data: deletedPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete package",
      error,
    });
  }
};

// PATCH /api/v1/packages/:id/assign-delivery -> attach a package to a delivery
//   Body: { "deliveryId": "<delivery _id>" }
//   The delivery must already exist. The package status is auto-set to "assigned".
//   Because the Delivery itself already has a `trip` reference, this also indirectly
//   places the package on a Trip (Package -> Delivery -> Trip).
export const assignPackageToDelivery = async (
  req: Request<{ id: string }, {}, AssignDeliveryBody>,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params; // package id from the URL
    const { deliveryId } = req.body; // delivery id from the body

    // Validate the package id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
      return;
    }

    // Validate the delivery id
    if (!deliveryId || !mongoose.Types.ObjectId.isValid(deliveryId)) {
      res.status(400).json({
        success: false,
        message: "Invalid or missing deliveryId",
      });
      return;
    }

    // Confirm the delivery actually exists before linking to it
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
      return;
    }

    // Update the package: set the delivery reference and bump status -> "assigned"
    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      {
        delivery: deliveryId,
        status: "assigned",
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate({
      path: "delivery",
      populate: { path: "trip" },
    });

    if (!updatedPackage) {
      res.status(404).json({
        success: false,
        message: "Package not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Package assigned to delivery successfully",
      data: updatedPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assign package to delivery",
      error,
    });
  }
};
