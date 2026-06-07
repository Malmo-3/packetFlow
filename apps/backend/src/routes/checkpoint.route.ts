import { Router } from "express";
import {
  createCheckpoint,
  deleteCheckpoint,
  getAllCheckpoints,
  getCheckpointById,
  updateCheckpoint,
} from "../controllers/checkpoint.controller";
import validateRequest from "../middleware/validateRequest";
import {
  checkpointIdParamSchema,
  createCheckpointSchema,
  updateCheckpointSchema,
} from "../schemas/checkpoint.schemas";

const checkpointRoute = Router();

checkpointRoute.post(
  "/",
  validateRequest({ body: createCheckpointSchema }),
  createCheckpoint,
);

checkpointRoute.get("/", getAllCheckpoints);

checkpointRoute.get(
  "/:id",
  validateRequest({ params: checkpointIdParamSchema }),
  getCheckpointById,
);

checkpointRoute.patch(
  "/:id",
  validateRequest({
    params: checkpointIdParamSchema,
    body: updateCheckpointSchema,
  }),
  updateCheckpoint,
);

checkpointRoute.delete(
  "/:id",
  validateRequest({ params: checkpointIdParamSchema }),
  deleteCheckpoint,
);

export default checkpointRoute;
