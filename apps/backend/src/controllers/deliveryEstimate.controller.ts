import type { NextFunction, Request, Response } from "express";
import DeliveryEstimate from "../models/deliveryEstimate.model";
import Package from "../models/package.model";
import Trip from "../models/trip.model";
import NotFoundError from "../errors/NotFoundError";
import ConflictError from "../errors/ConflictError";
import BadRequestError from "../errors/BadRequestError";
import type {
  CreateDeliveryEstimateInput,
  DeliveryEstimateIdParams,
  PackageIdParams,
  UpdateDeliveryEstimateInput,
} from "../schemas/deliveryEstimate.schemas";

export const createDeliveryEstimate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.validatedBody as CreateDeliveryEstimateInput;

    if (body.maxHours < body.minHours) {
      return next(new BadRequestError("Maximum hours cannot be less than minimum hours"));
    }

    const pkg = await Package.findById(body.package);
    if (!pkg) return next(new NotFoundError("Package not found"));

    if (body.trip) {
      const trip = await Trip.findById(body.trip);
      if (!trip) return next(new NotFoundError("Trip not found"));
    }

    const existing = await DeliveryEstimate.findOne({ package: body.package });
    if (existing) {
      return next(new ConflictError("Delivery estimate already exists for this package"));
    }

    const estimate = await DeliveryEstimate.create({
      ...body,
      status: body.status || "estimated",
    });
    const populated = await estimate.populate(["package", "trip"]);

    res.status(201).json({ success: true, message: "Delivery estimate created successfully", data: populated });
  } catch (error) {
    next(error);
  }
};

export const getAllDeliveryEstimates = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const estimates = await DeliveryEstimate.find()
      .populate(["package", "trip"])
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: estimates.length, data: estimates });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryEstimateById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as DeliveryEstimateIdParams;
    const estimate = await DeliveryEstimate.findById(id).populate(["package", "trip"]);
    if (!estimate) return next(new NotFoundError("Delivery estimate not found"));
    res.status(200).json({ success: true, data: estimate });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryEstimateByPackage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { packageId } = req.validatedParams as PackageIdParams;
    const pkg = await Package.findById(packageId);
    if (!pkg) return next(new NotFoundError("Package not found"));

    const estimate = await DeliveryEstimate.findOne({ package: packageId }).populate(["package", "trip"]);
    if (!estimate) return next(new NotFoundError("Delivery estimate not found"));
    res.status(200).json({ success: true, data: estimate });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryEstimate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as DeliveryEstimateIdParams;
    const body = req.validatedBody as UpdateDeliveryEstimateInput;

    const existing = await DeliveryEstimate.findById(id);
    if (!existing) return next(new NotFoundError("Delivery estimate not found"));

    if (body.trip) {
      const trip = await Trip.findById(body.trip);
      if (!trip) return next(new NotFoundError("Trip not found"));
    }

    const nextMin = body.minHours ?? existing.minHours;
    const nextMax = body.maxHours ?? existing.maxHours;
    if (nextMax < nextMin) {
      return next(new BadRequestError("Maximum hours cannot be less than minimum hours"));
    }

    Object.assign(existing, body, { status: body.status || "updated" });
    await existing.save();
    await existing.populate(["package", "trip"]);

    res.status(200).json({ success: true, message: "Delivery estimate updated successfully", data: existing });
  } catch (error) {
    next(error);
  }
};

export const deleteDeliveryEstimate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as DeliveryEstimateIdParams;
    const deleted = await DeliveryEstimate.findByIdAndDelete(id);
    if (!deleted) return next(new NotFoundError("Delivery estimate not found"));
    res.status(200).json({ success: true, message: "Delivery estimate deleted successfully" });
  } catch (error) {
    next(error);
  }
};
