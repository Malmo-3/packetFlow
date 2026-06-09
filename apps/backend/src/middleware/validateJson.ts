/**
 * Guards against wrong content types on write requests that actually carry a body.
 *
 * Important: several endpoints are intentionally body-less (e.g. the carrier
 * `POST /packages/:id/arrive` and `PATCH /notifications/read-all`). The client
 * does not set a Content-Type on those, so we must only enforce
 * `application/json` when a request body is genuinely present — otherwise we'd
 * reject legitimate, body-less calls with a 415.
 */

import type { NextFunction, Request, Response } from "express";

const methodsToCheck = new Set(["POST", "PUT", "PATCH"]);

const validateJson = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!methodsToCheck.has(req.method)) {
    next();
    return;
  }

  // No body → nothing to validate.
  const contentLength = req.headers["content-length"];
  const hasBody =
    (contentLength !== undefined && Number(contentLength) > 0) ||
    req.headers["transfer-encoding"] !== undefined;

  if (!hasBody) {
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
