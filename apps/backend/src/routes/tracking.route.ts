import { Router } from "express";
import { getTrackingByTrackingNumber } from "../controllers/tracking.controller";
import validateRequest from "../middleware/validateRequest";
import { trackingNumberParamSchema } from "../schemas/tracking.schemas";

const trackingRoute = Router();

trackingRoute.get(
  "/:trackingNumber",
  validateRequest({ params: trackingNumberParamSchema }),
  getTrackingByTrackingNumber,
);

export default trackingRoute;
