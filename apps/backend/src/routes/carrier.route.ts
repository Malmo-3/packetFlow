// Carrier flow: assigned trips, check-in/out, and package scans.
// Identity comes from the JWT; all routes require the carrier role.

import { Router } from "express";
import {
  checkIn,
  checkOut,
  endShift,
  getAssignedTrip,
  getTripPackages,
  scanPackage,
  validatePackageScan,
} from "../controllers/carrier.controller";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import validateRequest from "../middleware/validateRequest";
import {
  carrierScanBodySchema,
  carrierTripParamSchema,
} from "../schemas/carrier.schemas";

const carrierRoute = Router();

carrierRoute.use(authMiddleware, permit("carrier"));

carrierRoute.get("/trip", getAssignedTrip);

carrierRoute.get(
  "/trips/:tripId/packages",
  validateRequest({ params: carrierTripParamSchema }),
  getTripPackages,
);
carrierRoute.patch(
  "/trips/:tripId/check-in",
  validateRequest({ params: carrierTripParamSchema }),
  checkIn,
);
carrierRoute.patch(
  "/trips/:tripId/check-out",
  validateRequest({ params: carrierTripParamSchema }),
  checkOut,
);
carrierRoute.post(
  "/trips/:tripId/scans/validate",
  validateRequest({ params: carrierTripParamSchema, body: carrierScanBodySchema }),
  validatePackageScan,
);
carrierRoute.post(
  "/trips/:tripId/scans",
  validateRequest({ params: carrierTripParamSchema, body: carrierScanBodySchema }),
  scanPackage,
);
carrierRoute.patch(
  "/trips/:tripId/end-shift",
  validateRequest({ params: carrierTripParamSchema }),
  endShift,
);

export default carrierRoute;
