import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import validateRequest from "../middleware/validateRequest";
import {
  deleteAllNotifications,
  deleteNotification,
  getMyNotifications,
  markAllRead,
  markOneRead,
} from "../controllers/notification.controller";
import { notificationIdParamSchema } from "../schemas/notification.schemas";

const notificationRoute = Router();

// All notification routes are scoped to the authenticated user.
notificationRoute.use(authMiddleware);

notificationRoute.get("/", getMyNotifications);
// "/read-all" before "/:id/read".
notificationRoute.patch("/read-all", markAllRead);
notificationRoute.patch(
  "/:id/read",
  validateRequest({ params: notificationIdParamSchema }),
  markOneRead,
);

// Delete all of the caller's notifications. Registered before "/:id".
notificationRoute.delete("/", deleteAllNotifications);
notificationRoute.delete(
  "/:id",
  validateRequest({ params: notificationIdParamSchema }),
  deleteNotification,
);

export default notificationRoute;
