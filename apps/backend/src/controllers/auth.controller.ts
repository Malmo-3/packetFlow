import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import User from "../models/user.model";
import Package from "../models/package.model";
import type { LoginInput, RegisterInput } from "../schemas/auth.schemas";
import ConflictError from "../errors/ConflictError";
import UnauthorizedError from "../errors/UnauthorizedError";
import NotFoundError from "../errors/NotFoundError";

/**
 * POST /auth/register
 *
 * SECURITY: the role is taken from the validated body, which can only be
 * sender / recipient / carrier (see auth.schemas). `admin` is impossible here.
 */
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fullName, email, password, role } =
      req.validatedBody as RegisterInput;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      next(new ConflictError("User already exists with this email"));
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /auth/login */
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.validatedBody as LoginInput;

    const user = await User.findOne({ email });
    if (!user) {
      next(new UnauthorizedError("Invalid email or password"));
      return;
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      next(new UnauthorizedError("Invalid email or password"));
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is missing in environment variables");
    }

    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN ||
        "7d") as SignOptions["expiresIn"],
    };

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      jwtSecret,
      signOptions,
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
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

/** GET /auth/me — returns the decoded session (JWT payload). */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      next(new UnauthorizedError("User not authenticated"));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Authenticated user fetched successfully",
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/** PATCH /auth/me — update the signed-in user's own profile (name). */
export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as { fullName?: string };
    const update: Record<string, unknown> = {};
    if (typeof body.fullName === "string" && body.fullName.trim()) {
      update.fullName = body.fullName.trim();
    }

    const user = await User.findByIdAndUpdate(req.user!.userId, update, {
      new: true,
    }).select("-password");
    if (!user) return next(new NotFoundError("User not found"));

    res.status(200).json({
      success: true,
      message: "Profile updated",
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

/** DELETE /auth/me — delete the signed-in user's own account. */
export const deleteMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) return next(new NotFoundError("User not found"));

    // Detach the sender reference from any packages they created.
    await Package.updateMany({ senderId: userId }, { $unset: { senderId: 1 } });

    res.status(200).json({ success: true, message: "Account deleted" });
  } catch (error) {
    next(error);
  }
};
