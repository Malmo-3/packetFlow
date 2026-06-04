//* Defines endpoints for carrier trip and scan flow.

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

const carrierRoute = Router();

carrierRoute.get("/trip", getAssignedTrip);
carrierRoute.get("/trips/:tripId/packages", getTripPackages);
carrierRoute.patch("/trips/:tripId/check-in", checkIn);
carrierRoute.patch("/trips/:tripId/check-out", checkOut);
carrierRoute.post("/trips/:tripId/scans/validate", validatePackageScan);
carrierRoute.post("/trips/:tripId/scans", scanPackage);
carrierRoute.patch("/trips/:tripId/end-shift", endShift);

export default carrierRoute;