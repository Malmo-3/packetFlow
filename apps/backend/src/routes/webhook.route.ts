import { Router } from "express";
import {
  createWebhook,
  deleteWebhook,
  getAllWebhooks,
  getWebhookById,
  updateWebhook,
} from "../controllers/webhook.controller";
import validateRequest from "../middleware/validateRequest";
import {
  createWebhookSchema,
  updateWebhookSchema,
  webhookIdParamSchema,
} from "../schemas/webhook.schemas";

const webhookRoute = Router();

webhookRoute.post(
  "/",
  validateRequest({ body: createWebhookSchema }),
  createWebhook,
);

webhookRoute.get("/", getAllWebhooks);

webhookRoute.get(
  "/:id",
  validateRequest({ params: webhookIdParamSchema }),
  getWebhookById,
);

webhookRoute.patch(
  "/:id",
  validateRequest({
    params: webhookIdParamSchema,
    body: updateWebhookSchema,
  }),
  updateWebhook,
);

webhookRoute.delete(
  "/:id",
  validateRequest({ params: webhookIdParamSchema }),
  deleteWebhook,
);

export default webhookRoute;
