import { z } from "zod";

export const trackingNumberParamSchema = z.object({
  trackingNumber: z.string().trim().min(4, "Tracking number is required"),
});

export type TrackingNumberParams = z.infer<typeof trackingNumberParamSchema>;
