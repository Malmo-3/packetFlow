import { Router } from "express";
import {
  arriveAtDropOff,
  createPackage,
  deletePackageById,
  getAllPackages,
  getPackageById,
  getPackageTrip,
  markPickedUp,
  updatePackageById,
} from "../controllers/package.controller";
import authMiddleware from "../middleware/auth.middleware";
import optionalAuth from "../middleware/optionalAuth.middleware";
import { permit } from "../middleware/rbac";
import validateRequest from "../middleware/validateRequest";
import {
  createPackageSchema,
  objectIdParamSchema,
  updatePackageSchema,
} from "../schemas/package.schemas";

const packageRoute = Router();

// Public intake (optionalAuth stamps senderId when a sender is logged in).
packageRoute.post(
  "/",
  optionalAuth,
  validateRequest({ body: createPackageSchema }),
  createPackage,
);

// Authenticated reads — results scoped by role in the controller.
packageRoute.get("/", authMiddleware, getAllPackages);
packageRoute.get(
  "/:id",
  authMiddleware,
  validateRequest({ params: objectIdParamSchema }),
  getPackageById,
);
packageRoute.get(
  "/:id/trip",
  authMiddleware,
  validateRequest({ params: objectIdParamSchema }),
  getPackageTrip,
);

// Admin (any field) or carrier (status only, forward-only).
packageRoute.patch(
  "/:id",
  authMiddleware,
  permit("admin", "carrier"),
  validateRequest({ params: objectIdParamSchema, body: updatePackageSchema }),
  updatePackageById,
);

// Admin only.
packageRoute.delete(
  "/:id",
  authMiddleware,
  permit("admin"),
  validateRequest({ params: objectIdParamSchema }),
  deletePackageById,
);

// Carrier transitions.
packageRoute.post(
  "/:id/arrive",
  authMiddleware,
  permit("carrier"),
  validateRequest({ params: objectIdParamSchema }),
  arriveAtDropOff,
);
packageRoute.post(
  "/:id/pickup",
  authMiddleware,
  permit("carrier"),
  validateRequest({ params: objectIdParamSchema }),
  markPickedUp,
);

export default packageRoute;
