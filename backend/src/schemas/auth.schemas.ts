import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().pipe(z.email("Invalid email address")), // trim from string schema, and email velidation from z.email.. Pipe is chaining them.
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "carrier", "sender", "recipient"]).optional(),
});

export const loginSchema = z.object({
  // checks email format and password exxista..
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>; // z.infer creates typescript type directly from the zod schema ..
export type LoginInput = z.infer<typeof loginSchema>;
