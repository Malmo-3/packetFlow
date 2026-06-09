import { Router } from "express";
import {
  createScanRecord,
  getAllScanRecords,
  getScanHistoryForPackage,
  getScanRecordById,
} from "../controllers/scanRecord.controller";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import validateRequest from "../middleware/validateRequest";
import {
  createScanRecordSchema,
  packageIdParamSchema,
  scanRecordIdParamSchema,
} from "../schemas/scanRecord.schemas";

const scanRecordRoute = Router();

scanRecordRoute.use(authMiddleware);

// Package-scoped history: any authenticated user (recipients see their timeline).
scanRecordRoute.get(
  "/package/:packageId",
  validateRequest({ params: packageIdParamSchema }),
  getScanHistoryForPackage,
);

// Creating scans and browsing the full scan log is admin/carrier only.
scanRecordRoute.post(
  "/",
  permit("admin", "carrier"),
  validateRequest({ body: createScanRecordSchema }),
  createScanRecord,
);
scanRecordRoute.get("/", permit("admin", "carrier"), getAllScanRecords);
scanRecordRoute.get(
  "/:id",
  permit("admin", "carrier"),
  validateRequest({ params: scanRecordIdParamSchema }),
  getScanRecordById,
);

export default scanRecordRoute;
