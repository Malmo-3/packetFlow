import { Router } from "express";
import {
  createCarrier,
  deleteCarrier,
  getAllCarriers,
  getCarrierById,
  updateCarrier,
} from "../controllers/carrierEntity.controller";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import validateRequest from "../middleware/validateRequest";
import {
  carrierIdParamSchema,
  createCarrierSchema,
  updateCarrierSchema,
} from "../schemas/carrierEntity.schemas";

const carrierEntityRoute = Router();

// Carrier directory management is admin-only.
carrierEntityRoute.use(authMiddleware, permit("admin"));

carrierEntityRoute.get("/", getAllCarriers);
carrierEntityRoute.post(
  "/",
  validateRequest({ body: createCarrierSchema }),
  createCarrier,
);
carrierEntityRoute.get(
  "/:id",
  validateRequest({ params: carrierIdParamSchema }),
  getCarrierById,
);
carrierEntityRoute.patch(
  "/:id",
  validateRequest({ params: carrierIdParamSchema, body: updateCarrierSchema }),
  updateCarrier,
);
carrierEntityRoute.delete(
  "/:id",
  validateRequest({ params: carrierIdParamSchema }),
  deleteCarrier,
);

export default carrierEntityRoute;
