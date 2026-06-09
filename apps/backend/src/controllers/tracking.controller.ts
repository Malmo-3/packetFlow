import type { NextFunction, Request, Response } from "express";
import Package from "../models/package.model";
import { Delivery } from "../models/delivery.model";
import ScanRecord from "../models/scanRecord.model";
import DeliveryEstimate from "../models/deliveryEstimate.model";
import NotFoundError from "../errors/NotFoundError";
import type { TrackingNumberParams } from "../schemas/tracking.schemas";

// GET /tracking/:trackingNumber — full tracking view (package + delivery + history + estimate).
export const getTrackingByTrackingNumber = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { trackingNumber } = req.validatedParams as TrackingNumberParams;

    const pkg = await Package.findOne({ trackingNumber });
    if (!pkg) return next(new NotFoundError("Package not found"));

    const delivery = pkg.delivery
      ? await Delivery.findById(pkg.delivery).populate("trip")
      : null;

    const history = await ScanRecord.find({ package: pkg._id })
      .populate(["checkpoint", "trip", "carrier"])
      .sort({ scannedAt: 1 });

    const estimate = await DeliveryEstimate.findOne({ package: pkg._id }).populate("trip");

    res.status(200).json({
      success: true,
      data: { package: pkg, delivery, estimate, history },
    });
  } catch (error) {
    next(error);
  }
};
