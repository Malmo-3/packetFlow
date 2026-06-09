import { Router } from "express";
import {
  approveCarrierApplication,
  listCarrierApplications,
  rejectCarrierApplication,
  submitCarrierApplication,
} from "../controllers/carrierApplication.controller";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import validateRequest from "../middleware/validateRequest";
import {
  carrierApplicationIdParamSchema,
  submitCarrierApplicationSchema,
} from "../schemas/carrierApplication.schemas";

const carrierApplicationRoute = Router();

// Public: submit an application.
carrierApplicationRoute.post(
  "/",
  validateRequest({ body: submitCarrierApplicationSchema }),
  submitCarrierApplication,
);

// Admin: review + decide.
carrierApplicationRoute.get(
  "/",
  authMiddleware,
  permit("admin"),
  listCarrierApplications,
);
carrierApplicationRoute.patch(
  "/:id/approve",
  authMiddleware,
  permit("admin"),
  validateRequest({ params: carrierApplicationIdParamSchema }),
  approveCarrierApplication,
);
carrierApplicationRoute.patch(
  "/:id/reject",
  authMiddleware,
  permit("admin"),
  validateRequest({ params: carrierApplicationIdParamSchema }),
  rejectCarrierApplication,
);

export default carrierApplicationRoute;
