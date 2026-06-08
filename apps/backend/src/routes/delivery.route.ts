import { Router } from "express";
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
import validateRequest from "../middleware/validateRequest";
import {
  assignManyDeliveriesToTripSchema,
  assignTripToDeliverySchema,
  createDeliverySchema,
  deliveryIdParamSchema,
  updateDeliverySchema,
} from "../schemas/delivery.schemas";

const deliveryRoute = Router();

// creates delivery .. 
deliveryRoute.post(
  "/",
  validateRequest({ body: createDeliverySchema }),
  createDelivery,
);

deliveryRoute.get("/", getAllDeliveries); // get all delivereis 
deliveryRoute.get("/unassigned", getUnassignedDeliveries); // get unassined delivreis.

//get one delivery
deliveryRoute.get(
  "/:id",
  validateRequest({ params: deliveryIdParamSchema }),
  getDeliveryById,
);

// update delivery
deliveryRoute.patch(
  "/:id",
  validateRequest({
    params: deliveryIdParamSchema,
    body: updateDeliverySchema,
  }),
  updateDelivery,
);

// delete delivery
deliveryRoute.delete(
  "/:id",
  validateRequest({ params: deliveryIdParamSchema }),
  deleteDelivery,
);

// assing 1 trip to delivery 
deliveryRoute.patch(
  "/:id/assign-trip",
  validateRequest({
    params: deliveryIdParamSchema,
    body: assignTripToDeliverySchema,
  }),
  assignTripToDelivery,
);

// assign one trip to many deliveries
deliveryRoute.patch(
  "/assign-many-to-trip",
  validateRequest({ body: assignManyDeliveriesToTripSchema }),
  assignManyDeliveriesToTrip,
);

export default deliveryRoute;
