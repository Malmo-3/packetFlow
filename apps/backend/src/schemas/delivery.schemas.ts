import { z } from "zod";

export const deliveryIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid delivery ID"),
});

export const createDeliverySchema = z.object({
  packageId: z.string().trim().length(24, "Invalid package ID"),
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  status: z
    .enum(["pending", "assigned", "in_transit", "delivered", "cancelled"])
    .optional(),
});

export const updateDeliverySchema = z.object({
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  status: z
    .enum(["pending", "assigned", "in_transit", "delivered", "cancelled"])
    .optional(),
});

export const assignTripToDeliverySchema = z.object({
  tripId: z.string().trim().length(24, "Invalid trip ID"),
});

export const assignManyDeliveriesToTripSchema = z.object({
  tripId: z.string().trim().length(24, "Invalid trip ID"),
  deliveryIds: z
    .array(z.string().trim().length(24, "Invalid delivery ID"))
    .min(1, "deliveryIds must contain at least one ID"),
});

export type DeliveryIdParams = z.infer<typeof deliveryIdParamSchema>;
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
export type AssignTripToDeliveryInput = z.infer<
  typeof assignTripToDeliverySchema
>;
export type AssignManyDeliveriesToTripInput = z.infer<
  typeof assignManyDeliveriesToTripSchema
>;
