import { Router } from "express";
import { getMe, loginUser, registerUser, adminOnlyTest } from "../controllers/auth.controller";
import authMiddleware from "../middleware/auth.middleware";
import authorizeRoles from "../middleware/role.middleware";
import validateRequest from "../middleware/validateRequest";
import { loginSchema, registerSchema } from "../schemas/auth.schemas";

const authRoute = Router();

authRoute.post("/register", validateRequest({ body: registerSchema }), registerUser);
authRoute.post("/login", validateRequest({ body: loginSchema }), loginUser);
authRoute.get("/me", authMiddleware, getMe);
authRoute.get("/admin-test", authMiddleware, authorizeRoles("admin"), adminOnlyTest);

export default authRoute;