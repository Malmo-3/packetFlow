import type { NextFunction, Request, Response } from "express";
import Checkpoint from "../models/checkpoint.model";
import Trip from "../models/trip.model";
import NotFoundError from "../errors/NotFoundError";
import type {
  CheckpointIdParams,
  CreateCheckpointInput,
  UpdateCheckpointInput,
} from "../schemas/checkpoint.schemas";

export const createCheckpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.validatedBody as CreateCheckpointInput;

    if (body.trip) {
      const tripExists = await Trip.findById(body.trip);
      if (!tripExists) return next(new NotFoundError("Trip not found"));
    }

    const checkpoint = await Checkpoint.create({
      ...body,
      type: body.type || "custom",
    });

    res.status(201).json({
      success: true,
      message: "Checkpoint created successfully",
      data: checkpoint,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCheckpoints = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const checkpoints = await Checkpoint.find()
      .populate("trip")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: checkpoints.length, data: checkpoints });
  } catch (error) {
    next(error);
  }
};

export const getCheckpointById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as CheckpointIdParams;
    const checkpoint = await Checkpoint.findById(id).populate("trip");
    if (!checkpoint) return next(new NotFoundError("Checkpoint not found"));
    res.status(200).json({ success: true, data: checkpoint });
  } catch (error) {
    next(error);
  }
};

export const updateCheckpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as CheckpointIdParams;
    const body = req.validatedBody as UpdateCheckpointInput;

    if (body.trip) {
      const tripExists = await Trip.findById(body.trip);
      if (!tripExists) return next(new NotFoundError("Trip not found"));
    }

    const updated = await Checkpoint.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("trip");

    if (!updated) return next(new NotFoundError("Checkpoint not found"));
    res.status(200).json({ success: true, message: "Checkpoint updated successfully", data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCheckpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as CheckpointIdParams;
    const deleted = await Checkpoint.findByIdAndDelete(id);
    if (!deleted) return next(new NotFoundError("Checkpoint not found"));
    res.status(200).json({ success: true, message: "Checkpoint deleted successfully" });
  } catch (error) {
    next(error);
  }
};
