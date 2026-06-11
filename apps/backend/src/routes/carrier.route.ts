// Carrier flow: assigned trips, check-in/out, and package scans.
// Identity comes from the JWT; all routes require the carrier role.

import { Router } from "express";
import {
  acceptTrip,
  advanceTrip,
  checkIn,
  checkOut,
  deleteAccount,
  endShift,
  endShiftSession,
  getAssignedTrip,
  getHistory,
  getMe,
  getShift,
  getTripPackages,
  scanPackage,
  startShift,
  updateProfile,
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

// Self-service: profile, history, edit, delete.
carrierRoute.get("/me", getMe);
carrierRoute.get("/history", getHistory);
carrierRoute.patch("/profile", updateProfile);
carrierRoute.delete("/account", deleteAccount);

// Shift lifecycle (carrier on/off duty)
carrierRoute.get("/shift", getShift);
carrierRoute.post("/shift/start", startShift);
carrierRoute.post("/shift/end", endShiftSession);

carrierRoute.get("/trip", getAssignedTrip);

carrierRoute.post(
  "/trips/:tripId/accept",
  validateRequest({ params: carrierTripParamSchema }),
  acceptTrip,
);
carrierRoute.post(
  "/trips/:tripId/advance",
  validateRequest({ params: carrierTripParamSchema }),
  advanceTrip,
);

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
