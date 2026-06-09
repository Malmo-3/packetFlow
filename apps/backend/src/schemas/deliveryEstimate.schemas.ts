import { z } from "zod";

export const deliveryEstimateIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid delivery estimate ID"),
});

export const packageIdParamSchema = z.object({
  packageId: z.string().trim().length(24, "Invalid package ID"),
});

export const createDeliveryEstimateSchema = z.object({
  package: z.string().trim().length(24, "Invalid package ID"),
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  estimatedDeliveryAt: z.coerce.date(),
  minHours: z.number().min(0, "Minimum hours must be at least 0"),
  maxHours: z.number().min(0, "Maximum hours must be at least 0"),
  status: z.enum(["estimated", "updated", "expired"]).optional(),
  reason: z.string().trim().min(1, "Reason cannot be empty").optional(),
});

export const updateDeliveryEstimateSchema = z.object({
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  estimatedDeliveryAt: z.coerce.date().optional(),
  minHours: z.number().min(0).optional(),
  maxHours: z.number().min(0).optional(),
  status: z.enum(["estimated", "updated", "expired"]).optional(),
  reason: z.string().trim().min(1, "Reason cannot be empty").optional(),
});

export type DeliveryEstimateIdParams = z.infer<
  typeof deliveryEstimateIdParamSchema
>;
export type PackageIdParams = z.infer<typeof packageIdParamSchema>;
export type CreateDeliveryEstimateInput = z.infer<
  typeof createDeliveryEstimateSchema
>;
export type UpdateDeliveryEstimateInput = z.infer<
  typeof updateDeliveryEstimateSchema
>;
