import { z } from "zod";

export const tripIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid trip ID"),
});

export const createTripSchema = z.object({
  name: z.string().trim().min(2, "Trip name must be at least 2 characters"),
  region: z
    .string()
    .trim()
    .min(2, "Region must be at least 2 characters")
    .optional(),
  startCity: z
    .string()
    .trim()
    .min(2, "Start city must be at least 2 characters"),
  endCity: z.string().trim().min(2, "End city must be at least 2 characters"),
  stops: z.array(z.string().trim().min(1, "Stop cannot be empty")).optional(),
  assignedCarrier: z
    .string()
    .trim()
    .length(24, "Invalid carrier ID")
    .optional(),
  status: z.enum(["planned", "active", "completed"]).optional(),
});

export const updateTripSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Trip name must be at least 2 characters")
    .optional(),
  region: z
    .string()
    .trim()
    .min(2, "Region must be at least 2 characters")
    .optional(),
  startCity: z
    .string()
    .trim()
    .min(2, "Start city must be at least 2 characters")
    .optional(),
  endCity: z
    .string()
    .trim()
    .min(2, "End city must be at least 2 characters")
    .optional(),
  stops: z.array(z.string().trim().min(1, "Stop cannot be empty")).optional(),
  assignedCarrier: z
    .string()
    .trim()
    .length(24, "Invalid carrier ID")
    .optional(),
  status: z.enum(["planned", "active", "completed"]).optional(),
});

export const assignDeliveriesToTripSchema = z.object({
  deliveryIds: z
    .array(z.string().trim().length(24, "Invalid delivery ID"))
    .min(1, "deliveryIds must contain at least one ID"),
});

export type TripIdParams = z.infer<typeof tripIdParamSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type AssignDeliveriesToTripInput = z.infer<
  typeof assignDeliveriesToTripSchema
>;
