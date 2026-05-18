//Logic for CRUD and assigning packages to deliveries.

import { Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import Package from "../models/package.model";

// Generates a tracking number like "PKT-A3F9K2QM".
// Uses crypto.randomBytes so the output is unpredictable and collision-resistant.
const generateTrackingNumber = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = crypto
    .randomBytes(8)
    .reduce((acc, byte) => acc + chars[byte % chars.length], "");
  return `PKT-${random}`;
};


const handlePackageWriteError = (
  res: Response,
  error: unknown,
  fallbackMessage: string,
): void => {
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: fallbackMessage,
      error,
    });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: "trackingNumber already exists",
      error,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: fallbackMessage,
    error,
  });
};

// POST /api/v1/packages -> create a new package
// The tracking number is always generated server-side; any trackingNumber field
// the client sends is stripped out and ignored.
export const createPackage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { trackingNumber: _ignored, ...rest } = req.body;
    const trackingNumber = generateTrackingNumber();

    const newPackage = await Package.create({ ...rest, trackingNumber });

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: newPackage,
    });
  } catch (error) {
    handlePackageWriteError(res, error, "Failed to create package");
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
    handlePackageWriteError(res, error, "Failed to update package");
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

