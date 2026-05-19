import { z } from "zod";

export const objectIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid package ID"),
});

export const createPackageSchema = z.object({
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
  delivery: z.string().trim().length(24, "Invalid delivery ID").optional(),
});

export const updatePackageSchema = z.object({
  senderName: z.string().trim().min(2, "Sender name must be at least 2 characters").optional(),
  recipientName: z.string().trim().min(2, "Recipient name must be at least 2 characters").optional(),
  pickupCity: z.string().trim().min(2, "Pickup city must be at least 2 characters").optional(),
  destinationCity: z.string().trim().min(2, "Destination city must be at least 2 characters").optional(),
  deliveryAddress: z.string().trim().min(5, "Delivery address must be at least 5 characters").optional(),
  weight: z.number().positive("Weight must be greater than 0").optional(),
  dimensions: z.object({
    length: z.number().positive("Length must be greater than 0").optional(),
    width: z.number().positive("Width must be greater than 0").optional(),
    height: z.number().positive("Height must be greater than 0").optional(),
  }).optional(),
  status: z.enum(["registered", "assigned", "in_transit", "delivered"]).optional(),
  delivery: z.string().trim().length(24, "Invalid delivery ID").optional(),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type PackageIdParams = z.infer<typeof objectIdParamSchema>;