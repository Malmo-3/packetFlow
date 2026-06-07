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
    const validatedBody = req.validatedBody as CreateDeliveryEstimateInput;

    if (validatedBody.maxHours < validatedBody.minHours) {
      next(
        new BadRequestError("Maximum hours cannot be less than minimum hours"),
      );
      return;
    }

    const pkg = await Package.findById(validatedBody.package);
    if (!pkg) {
      next(new NotFoundError("Package not found"));
      return;
    }

    if (validatedBody.trip) {
      const trip = await Trip.findById(validatedBody.trip);
      if (!trip) {
        next(new NotFoundError("Trip not found"));
        return;
      }
    }

    const existingEstimate = await DeliveryEstimate.findOne({
      package: validatedBody.package,
    });

    if (existingEstimate) {
      next(
        new ConflictError("Delivery estimate already exists for this package"),
      );
      return;
    }

    const deliveryEstimate = await DeliveryEstimate.create({
      ...validatedBody,
      status: validatedBody.status || "estimated",
    });

    const populatedEstimate = await deliveryEstimate.populate([
      "package",
      "trip",
    ]);

    res.status(201).json({
      success: true,
      message: "Delivery estimate created successfully",
      data: populatedEstimate,
    });
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

    res.status(200).json({
      success: true,
      count: estimates.length,
      data: estimates,
    });
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

    const estimate = await DeliveryEstimate.findById(id).populate([
      "package",
      "trip",
    ]);

    if (!estimate) {
      next(new NotFoundError("Delivery estimate not found"));
      return;
    }

    res.status(200).json({
      success: true,
      data: estimate,
    });
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
    if (!pkg) {
      next(new NotFoundError("Package not found"));
      return;
    }

    const estimate = await DeliveryEstimate.findOne({
      package: packageId,
    }).populate(["package", "trip"]);

    if (!estimate) {
      next(new NotFoundError("Delivery estimate not found"));
      return;
    }

    res.status(200).json({
      success: true,
      data: estimate,
    });
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
    const validatedBody = req.validatedBody as UpdateDeliveryEstimateInput;

    const existingEstimate = await DeliveryEstimate.findById(id);

    if (!existingEstimate) {
      next(new NotFoundError("Delivery estimate not found"));
      return;
    }

    if (validatedBody.trip) {
      const trip = await Trip.findById(validatedBody.trip);
      if (!trip) {
        next(new NotFoundError("Trip not found"));
        return;
      }
    }

    const nextMinHours = validatedBody.minHours ?? existingEstimate.minHours;
    const nextMaxHours = validatedBody.maxHours ?? existingEstimate.maxHours;

    if (nextMaxHours < nextMinHours) {
      next(
        new BadRequestError("Maximum hours cannot be less than minimum hours"),
      );
      return;
    }

    Object.assign(existingEstimate, validatedBody, {
      status: validatedBody.status || "updated",
    });

    await existingEstimate.save();
    await existingEstimate.populate(["package", "trip"]);

    res.status(200).json({
      success: true,
      message: "Delivery estimate updated successfully",
      data: existingEstimate,
    });
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

    const deletedEstimate = await DeliveryEstimate.findByIdAndDelete(id);

    if (!deletedEstimate) {
      next(new NotFoundError("Delivery estimate not found"));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Delivery estimate deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
