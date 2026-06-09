import { z } from "zod";

export const deliveryIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid delivery ID"),
});

const deliveryStatus = z.enum([
  "pending",
  "assigned",
  "in_transit",
  "delivered",
  "cancelled",
]);

export const createDeliverySchema = z.object({
  packageId: z.string().trim().length(24, "Invalid package ID"),
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  status: deliveryStatus.optional(),
});

export const updateDeliverySchema = z.object({
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  status: deliveryStatus.optional(),
});

export const assignTripToDeliverySchema = z.object({
  tripId: z.string().trim().length(24, "Invalid trip ID"),
});

export type DeliveryIdParams = z.infer<typeof deliveryIdParamSchema>;
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
export type AssignTripToDeliveryInput = z.infer<
  typeof assignTripToDeliverySchema
>;
