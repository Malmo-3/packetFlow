import { Router } from "express";
import {
  createCheckpoint,
  deleteCheckpoint,
  getAllCheckpoints,
  getCheckpointById,
  updateCheckpoint,
} from "../controllers/checkpoint.controller";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import validateRequest from "../middleware/validateRequest";
import {
  checkpointIdParamSchema,
  createCheckpointSchema,
  updateCheckpointSchema,
} from "../schemas/checkpoint.schemas";

const checkpointRoute = Router();

checkpointRoute.use(authMiddleware);

checkpointRoute.get("/", getAllCheckpoints);
checkpointRoute.get(
  "/:id",
  validateRequest({ params: checkpointIdParamSchema }),
  getCheckpointById,
);

checkpointRoute.post(
  "/",
  permit("admin"),
  validateRequest({ body: createCheckpointSchema }),
  createCheckpoint,
);
checkpointRoute.patch(
  "/:id",
  permit("admin"),
  validateRequest({ params: checkpointIdParamSchema, body: updateCheckpointSchema }),
  updateCheckpoint,
);
checkpointRoute.delete(
  "/:id",
  permit("admin"),
  validateRequest({ params: checkpointIdParamSchema }),
  deleteCheckpoint,
);

export default checkpointRoute;
