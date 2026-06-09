import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import { getRetention, runAnonymization } from "../controllers/gdpr.controller";

const gdprRoute = Router();

gdprRoute.use(authMiddleware, permit("admin"));

gdprRoute.get("/retention", getRetention);
gdprRoute.post("/anonymize", runAnonymization);

export default gdprRoute;
