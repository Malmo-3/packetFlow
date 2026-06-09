import { Router } from "express";
import { getTrackingByTrackingNumber } from "../controllers/tracking.controller";
import authMiddleware from "../middleware/auth.middleware";
import validateRequest from "../middleware/validateRequest";
import { trackingNumberParamSchema } from "../schemas/tracking.schemas";

const trackingRoute = Router();

// Authenticated: the tracking view exposes recipient PII, so require a session.
trackingRoute.get(
  "/:trackingNumber",
  authMiddleware,
  validateRequest({ params: trackingNumberParamSchema }),
  getTrackingByTrackingNumber,
);

export default trackingRoute;
