import { z } from "zod";

export const webhookIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid webhook ID"),
});


// for routes like /api/v1/webhooks/:id .. 

export const createWebhookSchema = z.object({
  name: z.string().trim().min(2, "Webhook name must be at least 2 characters"),
  url: z.string().trim().url("Webhook URL must be valid"),
  event: z.enum([
    "package.status_changed",
    "delivery.status_changed",
    "scan.created",
  ]),
  secret: z.string().trim().min(1, "Secret cannot be empty").optional(),
  isActive: z.boolean().optional(),
});


// for routes like POST /api/v1/webhooks
export const updateWebhookSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Webhook name must be at least 2 characters")
    .optional(),
  url: z.string().trim().url("Webhook URL must be valid").optional(),
  event: z
    .enum(["package.status_changed", "delivery.status_changed", "scan.created"])
    .optional(),
  secret: z.string().trim().min(1, "Secret cannot be empty").optional(),
  isActive: z.boolean().optional(),
});

export type WebhookIdParams = z.infer<typeof webhookIdParamSchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
