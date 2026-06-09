import { Router } from "express";
import { getMe, loginUser, registerUser } from "../controllers/auth.controller";
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

export default authRoute;
