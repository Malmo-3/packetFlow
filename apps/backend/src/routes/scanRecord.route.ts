import { Router } from "express";
import {
  createScanRecord,
  getAllScanRecords,
  getScanHistoryForPackage,
  getScanRecordById,
} from "../controllers/scanRecord.controller";
import validateRequest from "../middleware/validateRequest";
import {
  createScanRecordSchema,
  packageIdParamSchema,
  scanRecordIdParamSchema,
} from "../schemas/scanRecord.schemas";

const scanRecordRoute = Router();

// POST /api/v1/scans crates a scan record.
scanRecordRoute.post(
  "/",
  validateRequest({ body: createScanRecordSchema }),
  createScanRecord,
);

// GET /api/v1/scans return all scan record. 
scanRecordRoute.get("/", getAllScanRecords);

// GET /api/v1/scans/:id return one scan record by id: 
scanRecordRoute.get(
  "/:id",
  validateRequest({ params: scanRecordIdParamSchema }),
  getScanRecordById,
);

// GET /api/v1/scans/package/:packageId returns packege and its full scan history
scanRecordRoute.get(
  "/package/:packageId",
  validateRequest({ params: packageIdParamSchema }),
  getScanHistoryForPackage,
);

export default scanRecordRoute;
