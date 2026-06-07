import { z } from "zod";

export const packageImportItemSchema = z.object({
  senderName: z.string().trim().min(2, "Sender name must be at least 2 characters"),
  recipientName: z.string().trim().min(2, "Recipient name must be at least 2 characters"),
  pickupCity: z.string().trim().min(2, "Pickup city must be at least 2 characters"),
  destinationCity: z.string().trim().min(2, "Destination city must be at least 2 characters"),
  deliveryAddress: z.string().trim().min(5, "Delivery address must be at least 5 characters"),
  weight: z.number().positive("Weight must be greater than 0"),
  dimensions: z.object({
    length: z.number().positive("Length must be greater than 0"),
    width: z.number().positive("Width must be greater than 0"),
    height: z.number().positive("Height must be greater than 0"),
  }),
  status: z.enum(["registered", "assigned", "in_transit", "delivered"]).optional(),
});

export const importPackagesJsonSchema = z.object({
  packages: z
    .array(packageImportItemSchema)
    .min(1, "At least one package is required"),
});

export type PackageImportItemInput = z.infer<typeof packageImportItemSchema>;
export type ImportPackagesJsonInput = z.infer<typeof importPackagesJsonSchema>;