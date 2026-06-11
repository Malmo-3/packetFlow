import { Router } from "express";
import { deleteMe, getMe, loginUser, registerUser, updateMe } from "../controllers/auth.controller";
import authMiddleware from "../middleware/auth.middleware";
import validateRequest from "../middleware/validateRequest";
import { loginSchema, registerSchema } from "../schemas/auth.schemas";

const authRoute = Router();

authRoute.post(
  "/register",
  validateRequest({ body: registerSchema }),
  registerUser,
);
authRoute.post(
  "/login",
  validateRequest({ body: loginSchema }),
  loginUser,
);
authRoute.get("/me", authMiddleware, getMe);
authRoute.patch("/me", authMiddleware, updateMe);
authRoute.delete("/me", authMiddleware, deleteMe);

export default authRoute;
