// Defines the endpoints for deliveries.

import express from "express";
import {
  assignManyDeliveriesToTrip,
  assignTripToDelivery,
  createDelivery,
  deleteDelivery,
  getAllDeliveries,
  getDeliveryById,
  getUnassignedDeliveries,
  updateDelivery,
} from "../controllers/delivery.controller";

const router = express.Router();

router.post("/", createDelivery); 
router.get("/", getAllDeliveries); 
router.get("/unassigned", getUnassignedDeliveries); 
router.get("/:id", getDeliveryById); 
router.patch("/:id", updateDelivery); 
router.delete("/:id", deleteDelivery); 

router.patch("/:id/assign-trip", assignTripToDelivery); 
router.patch("/assign-many-to-trip", assignManyDeliveriesToTrip); 
export default router;
