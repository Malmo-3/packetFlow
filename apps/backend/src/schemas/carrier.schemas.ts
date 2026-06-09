import { z } from "zod";

export const carrierTripParamSchema = z.object({
  tripId: z.string().trim().length(24, "Invalid trip ID"),
});

export const carrierScanBodySchema = z.object({
  packageId: z.string().trim().length(24, "Invalid package ID"),
  scanCode: z.string().trim().min(1, "scanCode is required"),
});

export type CarrierTripParams = z.infer<typeof carrierTripParamSchema>;
export type CarrierScanBody = z.infer<typeof carrierScanBodySchema>;
