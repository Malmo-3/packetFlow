import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import UnauthorizedError from "../errors/UnauthorizedError";

type AuthTokenPayload = JwtPayload & {
  userId: string;
  email: string;
  role: string;
};

/**
 * Require a valid Bearer JWT. Populates `req.user` on success.
 * All failures are forwarded to the central error handler as a 401 — the raw
 * error object is never serialised into the response.
 */
const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new UnauthorizedError("Authorization header missing or malformed"));
    return;
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    // Misconfiguration, not a client error — surface as a 500 generic message.
    next(new Error("JWT_SECRET is missing in environment variables"));
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
};

export default authMiddleware;
