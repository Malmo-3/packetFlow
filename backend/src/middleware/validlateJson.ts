//? this middleware checks:
//? iff request method is POST, Put or PATCH
//? then the request must have Content-Type: application/json

//? why is it useful? later the API will accept JSON bodies, - this protect the bakend from wrong content types,

import { NextFunction, Request, Response } from "express";

const methodsThatNeedJson = ["POST", "PUT", "PATCH"];

const validateJson = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!methodsThatNeedJson.includes(req.method)) {
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
