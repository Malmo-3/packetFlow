import { Router } from "express";
import {
  createDeliveryEstimate,
  deleteDeliveryEstimate,
  getAllDeliveryEstimates,
  getDeliveryEstimateById,
  getDeliveryEstimateByPackage,
  updateDeliveryEstimate,
} from "../controllers/deliveryEstimate.controller";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import validateRequest from "../middleware/validateRequest";
import {
  createDeliveryEstimateSchema,
  deliveryEstimateIdParamSchema,
  packageIdParamSchema,
  updateDeliveryEstimateSchema,
} from "../schemas/deliveryEstimate.schemas";

const deliveryEstimateRoute = Router();

deliveryEstimateRoute.use(authMiddleware);

// Reads: any authenticated user.
deliveryEstimateRoute.get("/", getAllDeliveryEstimates);
deliveryEstimateRoute.get(
  "/package/:packageId",
  validateRequest({ params: packageIdParamSchema }),
  getDeliveryEstimateByPackage,
);
deliveryEstimateRoute.get(
  "/:id",
  validateRequest({ params: deliveryEstimateIdParamSchema }),
  getDeliveryEstimateById,
);

// Writes: admin only.
deliveryEstimateRoute.post(
  "/",
  permit("admin"),
  validateRequest({ body: createDeliveryEstimateSchema }),
  createDeliveryEstimate,
);
deliveryEstimateRoute.patch(
  "/:id",
  permit("admin"),
  validateRequest({
    params: deliveryEstimateIdParamSchema,
    body: updateDeliveryEstimateSchema,
  }),
  updateDeliveryEstimate,
);
deliveryEstimateRoute.delete(
  "/:id",
  permit("admin"),
  validateRequest({ params: deliveryEstimateIdParamSchema }),
  deleteDeliveryEstimate,
);

export default deliveryEstimateRoute;
