//* Defines the endpoints for package operation..

import { Router } from "express";
import {
  createPackage,
  getAllPackages,
  getPackageById,
  updatePackageById,
  deletePackageById,
} from "../controllers/package.controller"; 

const packageRoute = Router();

packageRoute.post("/", createPackage); // POST /api/v1/packages -> create a new package
packageRoute.get("/", getAllPackages); // GET /api/v1/packages -> fetch all packages
packageRoute.get("/:id", getPackageById); //  = packages and /:id = /packages/abc12312
packageRoute.patch("/:id", updatePackageById); // HTTP method = PATCH, route param = :id, controller = updatePackageById > final url becomes /api/v1/packages/:id
packageRoute.delete("/:id", deletePackageById); // Method = delete, path= /id, controller = deletePackageById > DELETE /api/v1/packages/:id

export default packageRoute;
