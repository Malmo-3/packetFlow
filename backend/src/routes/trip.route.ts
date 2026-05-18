// Defines the endpoints for trips.

import express from "express";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import {
  assignDeliveriesToTrip,
  createTrip,
  deleteTrip,
  getAllTrips,
  getDeliveriesForTrip,
  getTripById,
  updateTrip,
} from "../controllers/trip.controller";

const router = express.Router();

router.post("/", createTrip);
router.get("/", getAllTrips);
router.get("/:id", getTripById);
router.patch("/:id", updateTrip);
router.delete("/:id", deleteTrip);

// GET  /trips/:id/deliveries -> list deliveries on this trip
// PATCH /trips/:id/deliveries -> bulk-assign deliveries to this trip (admin only)
router.get("/:id/deliveries", getDeliveriesForTrip);
router.patch(
  "/:id/deliveries",
  authMiddleware,
  permit("admin"),
  assignDeliveriesToTrip
);

export default router;
