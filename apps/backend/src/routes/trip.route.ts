import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import authorizeRoles from "../middleware/role.middleware";
import validateRequest from "../middleware/validateRequest";
import {
  assignDeliveriesToTrip,
  createTrip,
  deleteTrip,
  getAllTrips,
  getDeliveriesForTrip,
  getTripById,
  updateTrip,
} from "../controllers/trip.controller";
import {
  assignDeliveriesToTripSchema,
  createTripSchema,
  tripIdParamSchema,
  updateTripSchema,
} from "../schemas/trip.schemas";

const tripRoute = Router();

tripRoute.post("/", validateRequest({ body: createTripSchema }), createTrip);
tripRoute.get("/", getAllTrips);
tripRoute.get(
  "/:id",
  validateRequest({ params: tripIdParamSchema }),
  getTripById,
);
tripRoute.patch(
  "/:id",
  validateRequest({ params: tripIdParamSchema, body: updateTripSchema }),
  updateTrip,
);
tripRoute.delete(
  "/:id",
  validateRequest({ params: tripIdParamSchema }),
  deleteTrip,
);

tripRoute.get(
  "/:id/deliveries",
  validateRequest({ params: tripIdParamSchema }),
  getDeliveriesForTrip,
);

tripRoute.patch(
  "/:id/deliveries",
  authMiddleware,
  authorizeRoles("admin"),
  validateRequest({
    params: tripIdParamSchema,
    body: assignDeliveriesToTripSchema,
  }),
  assignDeliveriesToTrip,
);

export default tripRoute;
