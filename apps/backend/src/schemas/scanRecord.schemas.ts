import { z } from "zod";
import { PACKAGE_STATUSES } from "../shared/skane";

export const scanRecordIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid scan record ID"),
});

export const packageIdParamSchema = z.object({
  packageId: z.string().trim().length(24, "Invalid package ID"),
});

export const createScanRecordSchema = z.object({
  package: z.string().trim().length(24, "Invalid package ID"),
  checkpoint: z.string().trim().length(24, "Invalid checkpoint ID"),
  carrier: z.string().trim().length(24, "Invalid carrier ID").optional(),
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  scanCode: z.string().trim().min(1, "Scan code is required"),
  result: z.enum(["valid", "duplicate", "exception"]).optional(),
  packageStatusAfter: z.enum(PACKAGE_STATUSES),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  scannedAt: z.coerce.date().optional(),
});

export type ScanRecordIdParams = z.infer<typeof scanRecordIdParamSchema>;
export type PackageIdParams = z.infer<typeof packageIdParamSchema>;
export type CreateScanRecordInput = z.infer<typeof createScanRecordSchema>;
