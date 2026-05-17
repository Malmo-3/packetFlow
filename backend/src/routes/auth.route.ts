import { Router } from "express";
import {
  registerUser,
  loginUser,
  getMe,
  adminOnlyTest,
} from "../controllers/auth.controller";
import authMiddleware from "../middleware/auth.middleware";
import authorizeRoles from "../middleware/role.middleware";

const authRoute = Router();

authRoute.post("/register", registerUser);
authRoute.post("/login", loginUser);
authRoute.get("/me", authMiddleware, getMe);
authRoute.get("/admin-test", authMiddleware, authorizeRoles("admin"), adminOnlyTest);

export default authRoute;
