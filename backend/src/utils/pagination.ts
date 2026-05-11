// Reusable offset-based pagination helpers (page + limit query params).

import { Request } from "express";
import { z } from "zod";

// Query params arrive as strings, so we transform them into clamped ints.
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
});

export type Pagination = {
  page: number;
  limit: number;
  skip: number;
};

// Parse req.query into a ready-to-use { page, limit, skip } object.
// Throws ZodError on invalid input -> handled in controllers as a 400.
export const parsePagination = (req: Request): Pagination => {
  const { page, limit } = paginationSchema.parse(req.query);
  return { page, limit, skip: (page - 1) * limit };
};

// Build the metadata block returned alongside the data array.
export const buildMeta = (total: number, p: Pagination) => ({
  total,
  page: p.page,
  limit: p.limit,
  totalPages: Math.ceil(total / p.limit),
  hasNextPage: p.skip + p.limit < total,
  hasPrevPage: p.page > 1,
});
