import { z } from "zod";

export const carrierIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid carrier ID"),
});

export const createCarrierSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  vehicle: z.string().trim().min(1, "Vehicle/fleet description is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  active: z.boolean().optional(),
  user: z.string().trim().length(24, "Invalid user ID").optional(),
});

export const updateCarrierSchema = z.object({
  name: z.string().trim().min(2).optional(),
  vehicle: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  active: z.boolean().optional(),
  user: z.string().trim().length(24, "Invalid user ID").optional(),
});

export type CarrierIdParams = z.infer<typeof carrierIdParamSchema>;
export type CreateCarrierInput = z.infer<typeof createCarrierSchema>;
export type UpdateCarrierInput = z.infer<typeof updateCarrierSchema>;
