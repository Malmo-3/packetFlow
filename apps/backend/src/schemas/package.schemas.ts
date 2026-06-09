import { z } from "zod";
import { SKANE_CITIES, PACKAGE_STATUSES } from "../shared/skane";

export const objectIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid package ID"),
});

const skaneCity = z.enum(SKANE_CITIES, {
  message: "Must be a valid Skåne municipality",
});

const dimensionsSchema = z.object({
  length: z.number().positive("Length must be greater than 0"),
  width: z.number().positive("Width must be greater than 0"),
  height: z.number().positive("Height must be greater than 0"),
});

/**
 * Create-package body. `dropOffPoint`, `pickUpPoint`, `trackingNumber`,
 * `senderId` and `status` are all resolved server-side and never accepted here.
 */
export const createPackageSchema = z.object({
  senderName: z.string().trim().min(2, "Sender name must be at least 2 characters"),
  recipientName: z
    .string()
    .trim()
    .min(2, "Recipient name must be at least 2 characters"),
  recipientEmail: z.string().trim().toLowerCase().email("Invalid recipient email"),
  recipientPhone: z.string().trim().optional(),
  recipientAddress: z.string().trim().optional(),
  pickupCity: skaneCity,
  destinationCity: skaneCity,
  weight: z.number().positive("Weight must be greater than 0"),
  dimensions: dimensionsSchema,
});

/**
 * Update-package body. Admins may change any field; carriers may only advance
 * `status` (enforced in the controller). Cities are still Skåne-validated.
 */
export const updatePackageSchema = z.object({
  senderName: z.string().trim().min(2).optional(),
  recipientName: z.string().trim().min(2).optional(),
  recipientEmail: z.string().trim().toLowerCase().email().optional(),
  recipientPhone: z.string().trim().optional(),
  recipientAddress: z.string().trim().optional(),
  pickupCity: skaneCity.optional(),
  destinationCity: skaneCity.optional(),
  weight: z.number().positive().optional(),
  dimensions: dimensionsSchema.partial().optional(),
  status: z.enum(PACKAGE_STATUSES).optional(),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type PackageIdParams = z.infer<typeof objectIdParamSchema>;
