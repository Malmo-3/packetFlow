/**
 * Optional auth middleware.
 *
 * Like authMiddleware but never rejects: it populates `req.user` when a valid
 * Bearer token is present, and calls `next()` regardless. Used on routes that
 * behave differently for authenticated vs anonymous callers — e.g. the public
 * package intake form, which stamps `senderId` when a sender is logged in.
 */

import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

type AuthTokenPayload = JwtPayload & {
  userId: string;
  email: string;
  role: string;
};

const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return next();

    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    // Invalid / expired token — treat as anonymous, don't block.
  }
  next();
};

export default optionalAuth;
