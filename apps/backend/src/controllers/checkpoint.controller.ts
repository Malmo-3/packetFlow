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
    const validatedBody = req.validatedBody as CreateCheckpointInput;

    if (validatedBody.trip) {
      const tripExists = await Trip.findById(validatedBody.trip);

      if (!tripExists) {
        next(new NotFoundError("Trip not found"));
        return;
      }
    }

    const checkpoint = await Checkpoint.create({
      ...validatedBody,
      type: validatedBody.type || "custom",
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

    res.status(200).json({
      success: true,
      count: checkpoints.length,
      data: checkpoints,
    });
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

    if (!checkpoint) {
      next(new NotFoundError("Checkpoint not found"));
      return;
    }

    res.status(200).json({
      success: true,
      data: checkpoint,
    });
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
    const validatedBody = req.validatedBody as UpdateCheckpointInput;

    if (validatedBody.trip) {
      const tripExists = await Trip.findById(validatedBody.trip);

      if (!tripExists) {
        next(new NotFoundError("Trip not found"));
        return;
      }
    }

    const updatedCheckpoint = await Checkpoint.findByIdAndUpdate(
      id,
      validatedBody,
      {
        new: true,
        runValidators: true,
      },
    ).populate("trip");

    if (!updatedCheckpoint) {
      next(new NotFoundError("Checkpoint not found"));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Checkpoint updated successfully",
      data: updatedCheckpoint,
    });
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

    const deletedCheckpoint = await Checkpoint.findByIdAndDelete(id);

    if (!deletedCheckpoint) {
      next(new NotFoundError("Checkpoint not found"));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Checkpoint deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
