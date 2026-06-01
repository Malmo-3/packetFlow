import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import Package from "../models/package.model";
import ConflictError from "../errors/ConflictError";
import NotFoundError from "../errors/NotFoundError";
import type {
  CreatePackageInput,
  PackageIdParams,
  UpdatePackageInput,
} from "../schemas/package.schemas";

const generateTrackingNumber = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = crypto
    .randomBytes(8)
    .reduce((acc, byte) => acc + chars[byte % chars.length], "");
  return `PKT-${random}`;
};

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

export const createPackage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedBody = req.validatedBody as CreatePackageInput;
    const trackingNumber = generateTrackingNumber();

    const newPackage = await Package.create({
      ...validatedBody,
      trackingNumber,
    });

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: newPackage,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      next(error);
      return;
    }

    if (isMongoDuplicateKeyError(error)) {
      next(new ConflictError("Tracking number already exists"));
      return;
    }

    next(error);
  }
};

export const getAllPackages = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
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
    next(error);
  }
};

export const getPackageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as PackageIdParams;

    const singlePackage = await Package.findById(id).populate({
      path: "delivery",
      populate: { path: "trip" },
    });

    if (!singlePackage) {
      next(new NotFoundError("Package not found"));
      return;
    }

    res.status(200).json({
      success: true,
      data: singlePackage,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePackageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as PackageIdParams;
    const validatedBody = req.validatedBody as UpdatePackageInput;

    const updatedPackage = await Package.findByIdAndUpdate(id, validatedBody, {
      new: true,
      runValidators: true,
    });

    if (!updatedPackage) {
      next(new NotFoundError("Package not found"));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: updatedPackage,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      next(error);
      return;
    }

    if (isMongoDuplicateKeyError(error)) {
      next(new ConflictError("Tracking number already exists"));
      return;
    }

    next(error);
  }
};

export const deletePackageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as PackageIdParams;

    const deletedPackage = await Package.findByIdAndDelete(id);

    if (!deletedPackage) {
      next(new NotFoundError("Package not found"));
      return;
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
