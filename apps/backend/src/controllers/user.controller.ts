/**
 * User controller — admin-only.
 *
 * - listUsers   GET /users          → raw array (matches @packetflow/backend-client → users.ts)
 * - createUser  POST /users         → create sender/recipient/carrier (carrier approval path)
 * - deleteUser  DELETE /users/:id   → remove a user (admin cannot delete self)
 *
 * The password hash is never returned.
 */

import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import Trip from "../models/trip.model";
import ConflictError from "../errors/ConflictError";
import NotFoundError from "../errors/NotFoundError";
import BadRequestError from "../errors/BadRequestError";
import type { CreateUserInput, UserIdParams } from "../schemas/user.schemas";

const VALID_ROLES = ["admin", "carrier", "sender", "recipient"];

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    const filter = role && VALID_ROLES.includes(role) ? { role } : {};

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fullName, email, password, role } =
      req.validatedBody as CreateUserInput;

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new ConflictError("User already exists with this email"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.get("createdAt"),
      updatedAt: newUser.get("updatedAt"),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as UserIdParams;

    // Guard: an admin must not delete their own account (avoids lock-out).
    if (req.user?.userId === id) {
      return next(new BadRequestError("You cannot delete your own account"));
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return next(new NotFoundError("User not found"));

    // Detach the user from any trips they were assigned to as a carrier,
    // so the admin views don't show a dangling assignment.
    await Trip.updateMany(
      { assignedCarrier: id },
      { $unset: { assignedCarrier: 1 } },
    );

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};
