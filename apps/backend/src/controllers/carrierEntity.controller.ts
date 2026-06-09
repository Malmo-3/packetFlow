/**
 * Carrier entity CRUD (placeholder). Admin-only. Returns RAW shapes to match
 * the web app's `Carrier[]` / `Carrier` expectations.
 */

import type { NextFunction, Request, Response } from "express";
import Carrier from "../models/carrier.model";
import NotFoundError from "../errors/NotFoundError";
import type {
  CarrierIdParams,
  CreateCarrierInput,
  UpdateCarrierInput,
} from "../schemas/carrierEntity.schemas";

export const getAllCarriers = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const carriers = await Carrier.find().sort({ createdAt: -1 });
    res.status(200).json(carriers);
  } catch (error) {
    next(error);
  }
};

export const getCarrierById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as CarrierIdParams;
    const carrier = await Carrier.findById(id);
    if (!carrier) return next(new NotFoundError("Carrier not found"));
    res.status(200).json(carrier);
  } catch (error) {
    next(error);
  }
};

export const createCarrier = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.validatedBody as CreateCarrierInput;
    const carrier = await Carrier.create({ ...body, active: body.active ?? true });
    res.status(201).json(carrier);
  } catch (error) {
    next(error);
  }
};

export const updateCarrier = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as CarrierIdParams;
    const body = req.validatedBody as UpdateCarrierInput;
    const updated = await Carrier.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return next(new NotFoundError("Carrier not found"));
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteCarrier = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as CarrierIdParams;
    const deleted = await Carrier.findByIdAndDelete(id);
    if (!deleted) return next(new NotFoundError("Carrier not found"));
    res.status(200).json({ message: "Carrier deleted successfully" });
  } catch (error) {
    next(error);
  }
};
