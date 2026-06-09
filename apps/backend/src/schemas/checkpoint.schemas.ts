import { z } from "zod";

export const checkpointIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid checkpoint ID"),
});

const checkpointType = z.enum([
  "warehouse",
  "pickup",
  "dropoff",
  "sorting_center",
  "custom",
]);

export const createCheckpointSchema = z.object({
  name: z.string().trim().min(2, "Checkpoint name must be at least 2 characters"),
  city: z.string().trim().min(2, "City must be at least 2 characters"),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  stopOrder: z.number().int().min(1, "Stop order must be at least 1").optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  type: checkpointType.optional(),
});

export const updateCheckpointSchema = z.object({
  name: z.string().trim().min(2).optional(),
  city: z.string().trim().min(2).optional(),
  address: z.string().trim().min(5).optional(),
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  stopOrder: z.number().int().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  type: checkpointType.optional(),
});

export type CheckpointIdParams = z.infer<typeof checkpointIdParamSchema>;
export type CreateCheckpointInput = z.infer<typeof createCheckpointSchema>;
export type UpdateCheckpointInput = z.infer<typeof updateCheckpointSchema>;
