import { z } from "zod";
import { SELF_REGISTERABLE_ROLES } from "../shared/skane";

/**
 * Registration input.
 *
 * SECURITY: `role` is restricted to {@link SELF_REGISTERABLE_ROLES}
 * (sender / recipient) and defaults to `sender`. `carrier` and `admin` are
 * rejected here — carriers submit an application (`POST /carrier-applications`)
 * that an admin approves, and admins are created only via `createAdmin`.
 */
export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z
    .enum(SELF_REGISTERABLE_ROLES, {
      message: "Self-registration is only allowed as sender or recipient",
    })
    .optional()
    .default("sender"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
