import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import CarrierApplication from "../models/carrierApplication.model";
import User from "../models/user.model";
import Carrier from "../models/carrier.model";
import NotFoundError from "../errors/NotFoundError";
import ConflictError from "../errors/ConflictError";
import BadRequestError from "../errors/BadRequestError";
import type {
  CarrierApplicationIdParams,
  SubmitCarrierApplicationInput,
} from "../schemas/carrierApplication.schemas";

// POST /carrier-applications — public submission (no auto sign-in).
export const submitCarrierApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fullName, email, password, phone, vehicle, address } =
      req.validatedBody as SubmitCarrierApplicationInput;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ConflictError("An account with this email already exists"));
    }

    const pending = await CarrierApplication.findOne({ email, status: "pending" });
    if (pending) {
      return next(new ConflictError("An application for this email is already pending"));
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await CarrierApplication.create({
      fullName,
      email,
      phone,
      vehicle,
      address,
      passwordHash,
    });

    res.status(201).json({
      success: true,
      message: "Application submitted. An admin will review it shortly.",
    });
  } catch (error) {
    next(error);
  }
};

// GET /carrier-applications?status= — admin list.
export const listCarrierApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const filter = status ? { status } : {};

    const applications = await CarrierApplication.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

// PATCH /carrier-applications/:id/approve — admin; creates the carrier user + profile.
export const approveCarrierApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as CarrierApplicationIdParams;

    const application = await CarrierApplication.findById(id);
    if (!application) return next(new NotFoundError("Application not found"));
    if (application.status !== "pending") {
      return next(new BadRequestError(`Application is already ${application.status}`));
    }

    const existingUser = await User.findOne({ email: application.email });
    if (existingUser) {
      return next(new ConflictError("An account with this email already exists"));
    }

    const user = await User.create({
      fullName: application.fullName,
      email: application.email,
      password: application.passwordHash, // already hashed at submission
      role: "carrier",
    });

    await Carrier.create({
      name: application.fullName,
      vehicle: application.vehicle,
      phone: application.phone,
      active: true,
      user: user._id,
    });

    application.status = "approved";
    await application.save();

    res.status(200).json({
      success: true,
      message: "Carrier approved and account created",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /carrier-applications/:id/reject — admin.
export const rejectCarrierApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as CarrierApplicationIdParams;

    const application = await CarrierApplication.findById(id);
    if (!application) return next(new NotFoundError("Application not found"));
    if (application.status !== "pending") {
      return next(new BadRequestError(`Application is already ${application.status}`));
    }

    application.status = "rejected";
    await application.save();

    res.status(200).json({ success: true, message: "Application rejected" });
  } catch (error) {
    next(error);
  }
};
