import type { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";

const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof Error) {
    console.error("Unexpected error:", err.message);
  } else {
    console.error("Unexpected non-Error thrown:", err);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export default errorHandler;
