import { z } from "zod";

// this is for routes like /api/v1/checkpoints/:id
export const checkpointIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid checkpoint ID"),
});

// for routes POST /api/v1/checkpoints
export const createCheckpointSchema = z.object({
  name: z.string().trim().min(2, "Checkpoint name must be at least 2 characters"),
  city: z.string().trim().min(2, "City must be at least 2 characters"),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  stopOrder: z.number().int().min(1, "Stop order must be at least 1").optional(),
  latitude: z.number().min(-90, "Latitude must be at least -90").max(90, "Latitude must be at most 90"),
  longitude: z.number().min(-180, "Longitude must be at least -180").max(180, "Longitude must be at most 180"),
  type: z
    .enum(["warehouse", "pickup", "dropoff", "sorting_center", "custom"])
    .optional(),
});

export const updateCheckpointSchema = z.object({
  name: z.string().trim().min(2, "Checkpoint name must be at least 2 characters").optional(),
  city: z.string().trim().min(2, "City must be at least 2 characters").optional(),
  address: z.string().trim().min(5, "Address must be at least 5 characters").optional(),
  trip: z.string().trim().length(24, "Invalid trip ID").optional(),
  stopOrder: z.number().int().min(1, "Stop order must be at least 1").optional(),
  latitude: z.number().min(-90, "Latitude must be at least -90").max(90, "Latitude must be at most 90").optional(),
  longitude: z.number().min(-180, "Longitude must be at least -180").max(180, "Longitude must be at most 180").optional(),
  type: z
    .enum(["warehouse", "pickup", "dropoff", "sorting_center", "custom"])
    .optional(),
});

export type CheckpointIdParams = z.infer<typeof checkpointIdParamSchema>;
export type CreateCheckpointInput = z.infer<typeof createCheckpointSchema>;
export type UpdateCheckpointInput = z.infer<typeof updateCheckpointSchema>;