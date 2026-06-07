import { Router } from "express";
import {
  importPackagesFromCsv,
  importPackagesFromJson,
} from "../controllers/import.controller";
import uploadCsv from "../middleware/uploadCsv";
import validateRequest from "../middleware/validateRequest";
import { importPackagesJsonSchema } from "../schemas/import.schemas";

const importRoute = Router();

importRoute.post(
  "/packages/json",
  validateRequest({ body: importPackagesJsonSchema }),
  importPackagesFromJson,
);

importRoute.post(
  "/packages/csv",
  uploadCsv.single("file"),
  importPackagesFromCsv,
);

export default importRoute;
