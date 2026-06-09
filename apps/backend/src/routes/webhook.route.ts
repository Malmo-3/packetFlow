import { Router } from "express";
import {
  createWebhook,
  deleteWebhook,
  getAllWebhooks,
  getWebhookById,
  getWebhookLogs,
  updateWebhook,
} from "../controllers/webhook.controller";
import authMiddleware from "../middleware/auth.middleware";
import { permit } from "../middleware/rbac";
import validateRequest from "../middleware/validateRequest";
import {
  createWebhookSchema,
  updateWebhookSchema,
  webhookIdParamSchema,
} from "../schemas/webhook.schemas";

const webhookRoute = Router();

// Webhooks are sensitive (outbound URLs) — admin only.
webhookRoute.use(authMiddleware, permit("admin"));

webhookRoute.post("/", validateRequest({ body: createWebhookSchema }), createWebhook);
webhookRoute.get("/", getAllWebhooks);
// "/logs" before "/:id" so it isn't captured as a param.
webhookRoute.get("/logs", getWebhookLogs);
webhookRoute.get(
  "/:id",
  validateRequest({ params: webhookIdParamSchema }),
  getWebhookById,
);
webhookRoute.patch(
  "/:id",
  validateRequest({ params: webhookIdParamSchema, body: updateWebhookSchema }),
  updateWebhook,
);
webhookRoute.delete(
  "/:id",
  validateRequest({ params: webhookIdParamSchema }),
  deleteWebhook,
);

export default webhookRoute;
