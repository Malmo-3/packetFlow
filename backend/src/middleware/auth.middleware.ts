import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

type AuthTokenPayload = JwtPayload & {
  userId: string;
  email: string;
  role: string;
};

const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization; // reads the authorization header from the request. later client will send Authorization Bearer eyJhbGciOi...

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Authorization header is missing",
      });
      return;
    }

    if (!authHeader.startsWith("Bearer ")) { // chcks if the header has right format 
      res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
      return;
    }

    const token = authHeader.split(" ")[1]; // splits the string into 2 parts: bearer and actual token and takes the token part.

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is missing in environment variables");
    }

    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload; //   checks token was signed with ur secret, token has not expired, token is valid

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error,
    });
  }
};

export default authMiddleware;
