import { z } from "zod";

// this is for routes like api/v1/scans/:id
export const scanRecordIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid scan record ID"),
});

// this is for routes like /api/v1/scans/package/:packageId
export const packageIdParamSchema = z.object({
  packageId: z.string().trim().length(24, "Invalid package ID"),
});

// validates required packcage,checkpoint etc and some optional 
export const createScanRecordSchema = z.object({
  package: z.string().trim().length(24, "Invalid package ID"),
  checkpoint: z.string().trim().length(24, "Invalid checkpoint ID"),
  carrier: z.string().trim().length(24, "Invalid carrier ID").optional(),
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  scanCode: z.string().trim().min(1, "Scan code is required"),
  result: z.enum(["valid", "duplicate", "exception"]).optional(),
  packageStatusAfter: z.enum([
    "registered",
    "assigned",
    "in_transit",
    "delivered",
  ]),
  latitude: z
    .number()
    .min(-90, "Latitude must be at least -90")
    .max(90, "Latitude must be at most 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be at least -180")
    .max(180, "Longitude must be at most 180"),
  scannedAt: z.coerce.date().optional(),
});

export type ScanRecordIdParams = z.infer<typeof scanRecordIdParamSchema>;
export type PackageIdParams = z.infer<typeof packageIdParamSchema>;
export type CreateScanRecordInput = z.infer<typeof createScanRecordSchema>;
