//* Defines the endpoints for package operation..

import { Router } from "express";
import {
  createPackage,
  getAllPackages,
  getPackageById,
  updatePackageById,
  deletePackageById,
} from "../controllers/package.controller";
import validateRequest from "../middleware/validateRequest";
import {
  createPackageSchema,
  objectIdParamSchema,
  updatePackageSchema,
} from "../schemas/package.schemas";

const packageRoute = Router(); 

// packageRoute.post("/", createPackage); 
// packageRoute.get("/", getAllPackages); 
// packageRoute.get("/:id", getPackageById); 
// packageRoute.patch("/:id", updatePackageById); 
// packageRoute.delete("/:id", deletePackageById); 

packageRoute.post("/", validateRequest({ body: createPackageSchema }), createPackage);
packageRoute.get("/", getAllPackages);
packageRoute.get("/:id", validateRequest({ params: objectIdParamSchema }), getPackageById);
packageRoute.patch("/:id",validateRequest({ params: objectIdParamSchema, body: updatePackageSchema }), updatePackageById);
packageRoute.delete("/:id", validateRequest({ params: objectIdParamSchema }), deletePackageById);

export default packageRoute;