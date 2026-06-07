import { Router } from "express";
import {
  createDeliveryEstimate,
  deleteDeliveryEstimate,
  getAllDeliveryEstimates,
  getDeliveryEstimateById,
  getDeliveryEstimateByPackage,
  updateDeliveryEstimate,
} from "../controllers/deliveryEstimate.controller";
import validateRequest from "../middleware/validateRequest";
import {
  createDeliveryEstimateSchema,
  deliveryEstimateIdParamSchema,
  packageIdParamSchema,
  updateDeliveryEstimateSchema,
} from "../schemas/deliveryEstimate.schemas";

const deliveryEstimateRoute = Router();

deliveryEstimateRoute.post(
  "/",
  validateRequest({ body: createDeliveryEstimateSchema }),
  createDeliveryEstimate,
);

deliveryEstimateRoute.get("/", getAllDeliveryEstimates);

deliveryEstimateRoute.get(
  "/:id",
  validateRequest({ params: deliveryEstimateIdParamSchema }),
  getDeliveryEstimateById,
);

deliveryEstimateRoute.get(
  "/package/:packageId",
  validateRequest({ params: packageIdParamSchema }),
  getDeliveryEstimateByPackage,
);

deliveryEstimateRoute.patch(
  "/:id",
  validateRequest({
    params: deliveryEstimateIdParamSchema,
    body: updateDeliveryEstimateSchema,
  }),
  updateDeliveryEstimate,
);

deliveryEstimateRoute.delete(
  "/:id",
  validateRequest({ params: deliveryEstimateIdParamSchema }),
  deleteDeliveryEstimate,
);

export default deliveryEstimateRoute;
