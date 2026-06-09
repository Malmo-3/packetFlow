import { z } from "zod";
import { SKANE_CITIES, TRIP_STATUSES } from "../shared/skane";

export const tripIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid trip ID"),
});

const skaneCity = z.enum(SKANE_CITIES, {
  message: "Must be a valid Skåne municipality",
});

export const createTripSchema = z.object({
  name: z.string().trim().min(2, "Trip name must be at least 2 characters"),
  region: z.string().trim().min(2).optional(),
  startCity: skaneCity,
  endCity: skaneCity,
  stops: z.array(skaneCity).optional(),
  assignedCarrier: z.string().trim().length(24, "Invalid carrier ID").optional(),
  status: z.enum(TRIP_STATUSES).optional(),
});

export const updateTripSchema = z.object({
  name: z.string().trim().min(2).optional(),
  region: z.string().trim().min(2).optional(),
  startCity: skaneCity.optional(),
  endCity: skaneCity.optional(),
  stops: z.array(skaneCity).optional(),
  assignedCarrier: z.string().trim().length(24, "Invalid carrier ID").optional(),
  status: z.enum(TRIP_STATUSES).optional(),
});

/** Carrier status advance — only the status field, forward-only (checked in controller). */
export const updateTripStatusSchema = z.object({
  status: z.enum(TRIP_STATUSES),
});

export const assignDeliveriesToTripSchema = z.object({
  deliveryIds: z
    .array(z.string().trim().length(24, "Invalid delivery ID"))
    .min(1, "deliveryIds must contain at least one ID"),
});

export type TripIdParams = z.infer<typeof tripIdParamSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type UpdateTripStatusInput = z.infer<typeof updateTripStatusSchema>;
export type AssignDeliveriesToTripInput = z.infer<
  typeof assignDeliveriesToTripSchema
>;
