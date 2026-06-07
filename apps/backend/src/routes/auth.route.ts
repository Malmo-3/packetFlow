import { Router } from "express";
import { registerUser, loginUser, getMe } from "../controllers/auth.controller";
import authMiddleware from "../middleware/auth.middleware";

const authRoute = Router();

authRoute.post("/register", registerUser);
authRoute.post("/login", loginUser);
authRoute.get("/me", authMiddleware, getMe);

export default authRoute;
