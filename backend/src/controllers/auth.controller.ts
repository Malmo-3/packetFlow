import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import User from "../models/user.model";
import type { LoginInput, RegisterInput } from "../schemas/auth.schemas";
import ConflictError from "../errors/ConflictError";
import UnauthorizedError from "../errors/UnauthorizedError";

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
      // res.status(409).json({
      //   success: false,
      //   message: "User already exists with this email",
      // });
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
    // res.status(500).json({
    //   success: false,
    //   message: "Failed to register user",
    //   error,
    // });
  }
};

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
      // res.status(401).json({
      //   success: false,
      //   message: "Invalid email or password",
      // });
      return;
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      next(new UnauthorizedError("Invalid email or password"));
      // res.status(401).json({
      //   success: false,
      //   message: "Invalid email or password",
      // });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is missing in environment variables");
    }

    const signOptions: SignOptions = {
      // settings object for the jwt token..
      expiresIn: (process.env.JWT_EXPIRES_IN ||
        "1d") as SignOptions["expiresIn"],
    };

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
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
    // res.status(500).json({
    //   success: false,
    //   message: "Failed to login user",
    //   error,
    // });
  }
};

// protected controller action
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      next(new UnauthorizedError("User not authenticated"));
      // res.status(401).json({
      //   success: false,
      //   message: "User not authenticated",
      // });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Authenticated user fetched successfully",
      data: req.user,
    });
  } catch (error) {
    next(error);
    // res.status(500).json({
    //   success: false,
    //   message: "Failed to fetch authenticated user",
    //   error,
    // });
  }
};

//Admin only controller
export const adminOnlyTest = async (
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
      message: "Welcome admin, you have access to this route",
      data: req.user,
    });
  } catch (error) {
    next(error);
    // res.status(500).json({
    //   success: false,
    //   message: "Failed to access admin route",
    //   error,
    // });
  }
};
