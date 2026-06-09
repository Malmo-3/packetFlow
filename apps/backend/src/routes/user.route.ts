import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import validateRequest from "../middleware/validateRequest";
import { createUser, deleteUser, listUsers } from "../controllers/user.controller";
import { createUserSchema, userIdParamSchema } from "../schemas/user.schemas";

const userRoute = Router();

// Admin-only: list users (optionally filtered by ?role=carrier etc.)
userRoute.get("/", authMiddleware, permit("admin"), listUsers);

// Admin-only: create a sender/recipient/carrier account (carrier approval path).
userRoute.post(
  "/",
  authMiddleware,
  permit("admin"),
  validateRequest({ body: createUserSchema }),
  createUser,
);

// Admin-only: delete a user by id.
userRoute.delete(
  "/:id",
  authMiddleware,
  permit("admin"),
  validateRequest({ params: userIdParamSchema }),
  deleteUser,
);

export default userRoute;
