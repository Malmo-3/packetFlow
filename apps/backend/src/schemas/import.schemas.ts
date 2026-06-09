import { z } from "zod";
import { SKANE_CITIES } from "../shared/skane";

const skaneCity = z.enum(SKANE_CITIES, {
  message: "Must be a valid Skåne municipality",
});

/** A single importable package — same shape as the create-package contract. */
export const packageImportItemSchema = z.object({
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
  dimensions: z.object({
    length: z.number().positive("Length must be greater than 0"),
    width: z.number().positive("Width must be greater than 0"),
    height: z.number().positive("Height must be greater than 0"),
  }),
});

export const importPackagesJsonSchema = z.object({
  packages: z
    .array(packageImportItemSchema)
    .min(1, "At least one package is required"),
});

export type PackageImportItemInput = z.infer<typeof packageImportItemSchema>;
export type ImportPackagesJsonInput = z.infer<typeof importPackagesJsonSchema>;
