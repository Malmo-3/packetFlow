import { z } from "zod";
import { PACKAGE_STATUSES } from "../shared/skane";

export const webhookIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid webhook ID"),
});

// Status-based event model: a package status, or "all".
const webhookEvent = z.enum([...PACKAGE_STATUSES, "all"]);

export const createWebhookSchema = z.object({
  name: z.string().trim().min(1).optional(),
  url: z.string().trim().url("Webhook URL must be valid"),
  event: webhookEvent,
  active: z.boolean().optional(),
});

export const updateWebhookSchema = z.object({
  name: z.string().trim().min(1).optional(),
  url: z.string().trim().url("Webhook URL must be valid").optional(),
  event: webhookEvent.optional(),
  active: z.boolean().optional(),
});

export type WebhookIdParams = z.infer<typeof webhookIdParamSchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
