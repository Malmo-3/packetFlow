// Role-based access control middleware factory.
//
// Usage: router.post("/", authMiddleware, permit("admin", "sender"), handler)
// MUST run AFTER authMiddleware so `req.user` is populated by the JWT decode.

import { NextFunction, Request, Response } from "express";

export const permit = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Defensive: should never trip if authMiddleware ran first, but a 401
    // here makes a misconfigured route order obvious instead of throwing.
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Forbidden: insufficient role",
      });
      return;
    }

    next();
  };
};
