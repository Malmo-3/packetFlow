import { Router } from "express";
import {
  assignTripToDelivery,
  createDelivery,
  deleteDelivery,
  getAllDeliveries,
  getDeliveryById,
  getUnassignedDeliveries,
  updateDelivery,
} from "../controllers/delivery.controller";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import validateRequest from "../middleware/validateRequest";
import {
  assignTripToDeliverySchema,
  createDeliverySchema,
  deliveryIdParamSchema,
  updateDeliverySchema,
} from "../schemas/delivery.schemas";

const deliveryRoute = Router();

// Reads: admin or carrier.
deliveryRoute.get("/", authMiddleware, permit("admin", "carrier"), getAllDeliveries);
// "/unassigned" before "/:id" so it isn't captured as a param.
deliveryRoute.get(
  "/unassigned",
  authMiddleware,
  permit("admin", "carrier"),
  getUnassignedDeliveries,
);
deliveryRoute.get(
  "/:id",
  authMiddleware,
  permit("admin", "carrier"),
  validateRequest({ params: deliveryIdParamSchema }),
  getDeliveryById,
);

// Writes: admin only.
deliveryRoute.post(
  "/",
  authMiddleware,
  permit("admin"),
  validateRequest({ body: createDeliverySchema }),
  createDelivery,
);
deliveryRoute.patch(
  "/:id",
  authMiddleware,
  permit("admin"),
  validateRequest({ params: deliveryIdParamSchema, body: updateDeliverySchema }),
  updateDelivery,
);
deliveryRoute.delete(
  "/:id",
  authMiddleware,
  permit("admin"),
  validateRequest({ params: deliveryIdParamSchema }),
  deleteDelivery,
);
deliveryRoute.patch(
  "/:id/assign-trip",
  authMiddleware,
  permit("admin"),
  validateRequest({
    params: deliveryIdParamSchema,
    body: assignTripToDeliverySchema,
  }),
  assignTripToDelivery,
);

export default deliveryRoute;
