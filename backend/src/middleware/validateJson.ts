//? this middleware checks:
//? iff request method is POST, Put or PATCH
//? then the request must have Content-Type: application/json

//? why is it useful? later the API will accept JSON bodies, - this protect the bakend from wrong content types,

import type { NextFunction, Request, Response } from "express";

const validateJson = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const methodsToCheck = new Set(["POST", "PUT", "PATCH"]);

  if (!methodsToCheck.has(req.method)) {
    next();
    return;
  }

  const isCsvUploadRoute =
    req.method === "POST" &&
    req.originalUrl.startsWith("/api/v1/import/packages/csv");

  if (isCsvUploadRoute && req.is("multipart/form-data")) {
    next();
    return;
  }

  if (req.is("application/json")) {
    next();
    return;
  }

  res.status(415).json({
    success: false,
    message: "Content-Type must be application/json",
  });
};

export default validateJson;
