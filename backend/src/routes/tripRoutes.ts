// Defines the endpoints for trips.

import express from "express";
import {
  createTrip,
  deleteTrip,
  getAllTrips,
  getDeliveriesForTrip,
  getTripById,
  updateTrip,
} from "../controllers/tripController";

const router = express.Router();

router.post("/", createTrip); 
router.get("/", getAllTrips); 
router.get("/:id", getTripById); 
router.put("/:id", updateTrip); 
router.delete("/:id", deleteTrip); 
router.get("/:id/deliveries", getDeliveriesForTrip); 
export default router;
