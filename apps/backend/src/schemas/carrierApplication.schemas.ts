import { z } from "zod";
import { isSwedishPlate } from "../shared/skane";

export const carrierApplicationIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid application ID"),
});

export const submitCarrierApplicationSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().trim().min(1, "Phone is required"),
  vehicle: z
    .string()
    .trim()
    .refine(isSwedishPlate, "Enter a valid Swedish registration number, e.g. ABC 12D or ABC 123"),
  address: z.string().trim().optional(),
});

export const listApplicationsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export type CarrierApplicationIdParams = z.infer<
  typeof carrierApplicationIdParamSchema
>;
export type SubmitCarrierApplicationInput = z.infer<
  typeof submitCarrierApplicationSchema
>;
