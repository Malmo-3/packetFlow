import { z } from "zod";

export const notificationIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid notification ID"),
});

export type NotificationIdParams = z.infer<typeof notificationIdParamSchema>;
