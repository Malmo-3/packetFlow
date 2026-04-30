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
} from "../controllers/deliveryController";

const router = express.Router();

router.post("/", createDelivery); 
router.get("/", getAllDeliveries); 
router.get("/unassigned", getUnassignedDeliveries); 
router.get("/:id", getDeliveryById); 
router.put("/:id", updateDelivery); 
router.delete("/:id", deleteDelivery); 

router.put("/:id/assign-trip", assignTripToDelivery); 
router.put("/assign-many-to-trip", assignManyDeliveriesToTrip); 
export default router;
