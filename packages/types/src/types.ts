/**
 * @packageDocumentation
 * Shared domain types consumed by all apps (web, api, mobile).
 * Import from the package root: `import type { Role } from "@packetflow/types"`.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Every user account belongs to exactly one of these roles. */
export type Role = "admin" | "carrier" | "sender" | "recipient";

/**
 * Lifecycle states a package moves through in order.
 * Transitions are strictly forward — no status may be set to an earlier value.
 *
 * ```
 * registered → assigned → in_transit → out_for_delivery → delivered
 *                                    ↘ exception
 * ```
 */
export type PackageStatus =
  | "registered"
  | "assigned"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

/** A registered user of PacketFlow. */
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  address?: string;
  phone?: string;
  /** Unique public carrier id (e.g. `CR-7QF3K9PA`) — present for carriers. */
  carrierId?: string;
  createdAt: string;
}

/** A carrier employee record (separate from IUser — may be merged later). */
export interface ICarrier {
  id: string;
  name: string;
  /** Human-readable description of vehicle or fleet unit. */
  vehicle: string;
  phone: string;
  active: boolean;
}

/** A physical waypoint on a delivery route (e.g. a drop-off point or depot). */
export interface ICheckpoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/** A named delivery route composed of an ordered sequence of checkpoints. */
export interface IRoute {
  id: string;
  name: string;
  carrierId?: string;
  checkpointIds: string[];
  createdAt: string;
}

/** Package dimensions in centimetres. */
export interface IDimensions {
  length: number;
  width: number;
  height: number;
}

/** A parcel registered in the system. */
export interface IPackage {
  id: string;
  /** Human-readable tracking code in the format `PF-XXXX-XXXX`. */
  trackingCode: string;
  senderId: string;
  recipientId: string;
  recipientName: string;
  recipientAddress: string;
  weightKg: number;
  dimensions: IDimensions;
  notes?: string;
  status: PackageStatus;
  routeId?: string;
  carrierId?: string;
  createdAt: string;
  estimatedDelivery?: string;
}

/**
 * A scan event recorded by a carrier when a package passes through a checkpoint.
 * Used to build the public tracking timeline.
 */
export interface IScan {
  id: string;
  packageId: string;
  checkpointId?: string;
  checkpointName: string;
  lat: number;
  lng: number;
  timestamp: string;
  status: PackageStatus;
  note?: string;
}

/** An outbound webhook subscription. Fires whenever the subscribed event occurs. */
export interface IWebhook {
  id: string;
  /** The URL that receives POST requests when the event fires. */
  url: string;
  /** Either a specific package status or `"all"` to receive every event. */
  event: PackageStatus | "all";
  active: boolean;
  createdAt: string;
}

/** A single delivery attempt log entry for a webhook. */
export interface IWebhookLog {
  id: string;
  webhookId: string;
  packageId: string;
  event: PackageStatus;
  /** JSON-serialised payload that was sent. */
  payload: string;
  timestamp: string;
  delivered: boolean;
}

/** Minimal session data stored in the JWT / server session. */
export interface ISession {
  userId: string;
  role: Role;
}

// ---------------------------------------------------------------------------
// Zod validation schemas
// ---------------------------------------------------------------------------

const emailSchema = z.string().trim().min(1, "Enter an email.").email("Enter a valid email.");
const nameSchema = z.string().trim().min(1, "Enter your name.");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters.");

/** Validates the sign-up form for sender and recipient accounts. */
export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    role: z.enum(["sender", "recipient"]),
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/** Inferred input type for {@link signUpSchema}. */
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Validates the carrier registration form (extra vehicle / phone fields). */
export const carrierSignupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: z.string().trim().min(1, "Enter a phone number."),
    vehicle: z.string().trim().min(1, "Describe your vehicle or fleet unit."),
    address: z.string().trim().optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/** Inferred input type for {@link carrierSignupSchema}. */
export type CarrierSignupInput = z.infer<typeof carrierSignupSchema>;

/** Validates package dimension fields. */
export const dimensionsSchema = z.object({
  length: z.number().positive("Length must be positive."),
  width: z.number().positive("Width must be positive."),
  height: z.number().positive("Height must be positive."),
});

/** Validates the create-package form. */
export const createPackageSchema = z.object({
  recipientId: z.string().trim().min(1, "Choose a recipient."),
  recipientName: z.string().trim().min(1),
  recipientAddress: z.string().trim().min(1),
  weightKg: z.number().positive("Weight must be positive."),
  dimensions: dimensionsSchema,
  notes: z.string().trim().optional(),
});

/** Inferred input type for {@link createPackageSchema}. */
export type CreatePackageInput = z.infer<typeof createPackageSchema>;

/**
 * Validates a PacketFlow tracking code.
 * Must match the pattern `PF-XXXX-XXXX` (uppercase alphanumeric segments).
 */
export const trackingCodeSchema = z
  .string()
  .trim()
  .regex(/^PF-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Tracking code must look like PF-XXXX-XXXX.");

/** Inferred type for a valid tracking code string. */
export type TrackingCode = z.infer<typeof trackingCodeSchema>;

// ---------------------------------------------------------------------------
// Plain-name aliases (no I-prefix)
// Consumers may import `User`, `Package`, etc. directly from `@packetflow/types`
// instead of using the I-prefixed interface names.
// ---------------------------------------------------------------------------

/** @see {@link IUser} */
export type User = IUser;
/** @see {@link ICarrier} */
export type Carrier = ICarrier;
/** @see {@link ICheckpoint} */
export type Checkpoint = ICheckpoint;
/** @see {@link IRoute} */
export type Route = IRoute;
/** @see {@link IDimensions} */
export type Dimensions = IDimensions;
/** @see {@link IPackage} */
export type Package = IPackage;
/** @see {@link IScan} */
export type Scan = IScan;
/** @see {@link IWebhook} */
export type Webhook = IWebhook;
/** @see {@link IWebhookLog} */
export type WebhookLog = IWebhookLog;
/** @see {@link ISession} */
export type Session = ISession;
