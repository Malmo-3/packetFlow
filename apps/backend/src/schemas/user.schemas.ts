import { z } from "zod";
import { ADMIN_CREATABLE_ROLES } from "../shared/skane";

/**
 * Admin-only user creation. An admin can create sender / recipient / carrier
 * accounts (e.g. approving a carrier). `admin` is NOT creatable here — admins
 * are bootstrapped only via `src/scripts/createAdmin.ts`.
 */
export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(ADMIN_CREATABLE_ROLES, {
    message: "Role must be one of: sender, recipient, carrier",
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Validates the `:id` route param for user-scoped endpoints (e.g. delete). */
export const userIdParamSchema = z.object({
  id: z.string().trim().length(24, "Invalid user ID"),
});

export type UserIdParams = z.infer<typeof userIdParamSchema>;
