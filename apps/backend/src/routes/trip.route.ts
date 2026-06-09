import { Router } from "express";
import {
  assignDeliveriesToTrip,
  createTrip,
  deleteTrip,
  getAllTrips,
  getDeliveriesForTrip,
  getMyTrips,
  getTripById,
  optimizeTripStops,
  updateTrip,
  updateTripStatus,
} from "../controllers/trip.controller";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import validateRequest from "../middleware/validateRequest";
import {
  assignDeliveriesToTripSchema,
  createTripSchema,
  tripIdParamSchema,
  updateTripSchema,
  updateTripStatusSchema,
} from "../schemas/trip.schemas";

const tripRoute = Router();

// Carrier: own trips — must be registered before "/:id".
tripRoute.get("/my", authMiddleware, permit("carrier"), getMyTrips);

tripRoute.post(
  "/",
  authMiddleware,
  permit("admin"),
  validateRequest({ body: createTripSchema }),
  createTrip,
);
tripRoute.get("/", authMiddleware, getAllTrips);
tripRoute.get(
  "/:id",
  authMiddleware,
  validateRequest({ params: tripIdParamSchema }),
  getTripById,
);
tripRoute.patch(
  "/:id",
  authMiddleware,
  permit("admin"),
  validateRequest({ params: tripIdParamSchema, body: updateTripSchema }),
  updateTrip,
);
tripRoute.delete(
  "/:id",
  authMiddleware,
  permit("admin"),
  validateRequest({ params: tripIdParamSchema }),
  deleteTrip,
);

// Carrier: advance own trip status.
tripRoute.patch(
  "/:id/status",
  authMiddleware,
  permit("carrier"),
  validateRequest({ params: tripIdParamSchema, body: updateTripStatusSchema }),
  updateTripStatus,
);

tripRoute.patch(
  "/:id/optimize",
  authMiddleware,
  permit("admin"),
  validateRequest({ params: tripIdParamSchema }),
  optimizeTripStops,
);

tripRoute.get(
  "/:id/deliveries",
  authMiddleware,
  validateRequest({ params: tripIdParamSchema }),
  getDeliveriesForTrip,
);
tripRoute.patch(
  "/:id/deliveries",
  authMiddleware,
  permit("admin"),
  validateRequest({
    params: tripIdParamSchema,
    body: assignDeliveriesToTripSchema,
  }),
  assignDeliveriesToTrip,
);

export default tripRoute;
