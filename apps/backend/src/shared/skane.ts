/**
 * Shared domain constants — vendored from the monorepo `@packetflow/types`
 * package (packages/types/src/constants.ts) so this backend is self-contained
 * and does not depend on a build step for the shared package.
 *
 * Keep in sync with packages/types if the canonical list changes.
 */

/** Every user account belongs to exactly one of these roles. */
export type Role = "admin" | "carrier" | "sender" | "recipient";

/**
 * Roles a user is allowed to pick when self-registering.
 *
 * Only `sender` and `recipient` self-register. `carrier` applicants submit a
 * carrier application (`POST /carrier-applications`) which an admin approves —
 * the carrier User is created at approval time. `admin` is created only via the
 * `createAdmin` script. Listing the allowed roles explicitly closes the
 * privilege-escalation hole where registration trusted any client-supplied role.
 */
export const SELF_REGISTERABLE_ROLES = ["sender", "recipient"] as const;

/** Roles an admin may create through the admin-only user-creation endpoint. */
export const ADMIN_CREATABLE_ROLES = ["sender", "recipient", "carrier"] as const;

/**
 * Valid Swedish registration plate formats (matched on a normalised value):
 * - Current (since 2019): 3 letters, 2 digits, 1 letter — e.g. `ABC 12D`
 * - Older:                3 letters, 3 digits           — e.g. `ABC 123`
 */
export const SWEDISH_PLATE_REGEX = /^[A-Z]{3}\d{2}[A-Z]$|^[A-Z]{3}\d{3}$/;

/** True if `value` is a valid Swedish registration plate (space/case-insensitive). */
export function isSwedishPlate(value: string): boolean {
  return SWEDISH_PLATE_REGEX.test(value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
}

/**
 * Package lifecycle states. Transitions are strictly forward:
 * `registered` → `assigned` → `in_transit` → `out_for_delivery` → `delivered`
 * (with `exception` as an off-ramp).
 */
export type PackageStatus =
  | "registered"
  | "assigned"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export const PACKAGE_STATUSES = [
  "registered",
  "assigned",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
] as const;

/** Trip lifecycle states. Strictly forward: planned → active → completed. */
export type TripStatus = "planned" | "active" | "completed";
export const TRIP_STATUSES = ["planned", "active", "completed"] as const;

/**
 * All 33 Skåne (Scania) municipalities PacketFlow operates in.
 * City inputs on packages and trips are validated against this list.
 */
export const SKANE_CITIES = [
  "Bjuv",
  "Bromölla",
  "Burlöv",
  "Båstad",
  "Eslöv",
  "Helsingborg",
  "Hässleholm",
  "Höganäs",
  "Hörby",
  "Höör",
  "Klippan",
  "Kristianstad",
  "Kävlinge",
  "Landskrona",
  "Lomma",
  "Lund",
  "Malmö",
  "Osby",
  "Perstorp",
  "Simrishamn",
  "Sjöbo",
  "Skurup",
  "Staffanstorp",
  "Svalöv",
  "Svedala",
  "Tomelilla",
  "Trelleborg",
  "Vellinge",
  "Ystad",
  "Åstorp",
  "Ängelholm",
  "Örkelljunga",
  "Östra Göinge",
] as const;

/** A single valid Skåne municipality name. */
export type SkaneCity = (typeof SKANE_CITIES)[number];

/**
 * Official PacketFlow drop-off / collection point for every Skåne municipality.
 * Resolved server-side from a package's cities — never sent by the client.
 */
export const DROP_OFF_POINTS: Record<SkaneCity, string> = {
  Bjuv: "PacketFlow Bjuv, Storgatan 12, 267 31 Bjuv",
  Bromölla: "PacketFlow Bromölla, Järnvägsgatan 4, 295 31 Bromölla",
  Burlöv: "PacketFlow Burlöv, Kronetorpsvägen 8, 232 37 Arlöv",
  Båstad: "PacketFlow Båstad, Köpmansgatan 3, 269 31 Båstad",
  Eslöv: "PacketFlow Eslöv, Stortorget 2, 241 30 Eslöv",
  Helsingborg: "PacketFlow Helsingborg, Järnvägsgatan 14, 252 24 Helsingborg",
  Hässleholm: "PacketFlow Hässleholm, Stationsgatan 22, 281 31 Hässleholm",
  Höganäs: "PacketFlow Höganäs, Hamnvägen 5, 263 31 Höganäs",
  Hörby: "PacketFlow Hörby, Stortorget 9, 242 30 Hörby",
  Höör: "PacketFlow Höör, Ringvägen 1, 243 30 Höör",
  Klippan: "PacketFlow Klippan, Trädgårdsgatan 7, 264 30 Klippan",
  Kristianstad: "PacketFlow Kristianstad, Östra Boulevarden 33, 291 31 Kristianstad",
  Kävlinge: "PacketFlow Kävlinge, Industrigatan 6, 244 31 Kävlinge",
  Landskrona: "PacketFlow Landskrona, Rådhusgatan 11, 261 31 Landskrona",
  Lomma: "PacketFlow Lomma, Hamngatan 2, 234 31 Lomma",
  Lund: "PacketFlow Lund, Bangatan 8, 222 29 Lund",
  Malmö: "PacketFlow Malmö, Centralplan 15, 211 20 Malmö",
  Osby: "PacketFlow Osby, Storgatan 5, 283 31 Osby",
  Perstorp: "PacketFlow Perstorp, Fabriksgatan 3, 284 30 Perstorp",
  Simrishamn: "PacketFlow Simrishamn, Storgatan 24, 272 31 Simrishamn",
  Sjöbo: "PacketFlow Sjöbo, Järnvägsgatan 10, 275 30 Sjöbo",
  Skurup: "PacketFlow Skurup, Stortorget 1, 274 30 Skurup",
  Staffanstorp: "PacketFlow Staffanstorp, Rådhusvägen 4, 245 31 Staffanstorp",
  Svalöv: "PacketFlow Svalöv, Järnvägsgatan 2, 268 30 Svalöv",
  Svedala: "PacketFlow Svedala, Storgatan 16, 233 31 Svedala",
  Tomelilla: "PacketFlow Tomelilla, Göingevägen 3, 273 30 Tomelilla",
  Trelleborg: "PacketFlow Trelleborg, Hamngatan 19, 231 41 Trelleborg",
  Vellinge: "PacketFlow Vellinge, Norrevångsgatan 3, 235 31 Vellinge",
  Ystad: "PacketFlow Ystad, Stortorget 7, 271 31 Ystad",
  Åstorp: "PacketFlow Åstorp, Järnvägsgatan 8, 265 31 Åstorp",
  Ängelholm: "PacketFlow Ängelholm, Järnvägsgatan 20, 262 32 Ängelholm",
  Örkelljunga: "PacketFlow Örkelljunga, Stortorget 4, 286 30 Örkelljunga",
  "Östra Göinge": "PacketFlow Broby, Storgatan 11, 289 30 Broby",
};
