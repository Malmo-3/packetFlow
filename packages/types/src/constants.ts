/**
 * @packageDocumentation
 * Runtime constants shared across all apps.
 * Import from the package root: `import { SKANE_CITIES } from "@packetflow/types"`.
 */

import type { Role, PackageStatus } from "./types";

// ---------------------------------------------------------------------------
// Roles & statuses
// ---------------------------------------------------------------------------

/** All valid user roles as a readonly tuple — useful for validation loops. */
export const ROLES: readonly Role[] = [
  "admin",
  "carrier",
  "sender",
  "recipient",
] as const;

/** All valid package status values as a readonly tuple. */
export const PACKAGE_STATUSES: readonly PackageStatus[] = [
  "registered",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
] as const;

/**
 * Human-readable labels for each {@link PackageStatus}.
 * Used in status badges, tracking timelines, and filter dropdowns.
 */
export const statusLabels: Record<PackageStatus, string> = {
  registered:       "Registered",
  assigned:         "Assigned",
  in_transit:       "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
  exception:        "Exception",
};

// ---------------------------------------------------------------------------
// Skåne region
// ---------------------------------------------------------------------------

/**
 * All 33 Skåne (Scania) municipalities that PacketFlow operates in.
 * Used to validate city inputs on both the API (controller-level) and the
 * web UI (dropdown menus). The API rejects any city not in this list.
 *
 * @see {@link DROP_OFF_POINTS} for the physical address of each city's depot.
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
] as const;

/**
 * A single valid Skåne municipality name.
 * Derived from {@link SKANE_CITIES} so it always stays in sync.
 */
export type SkaneCity = (typeof SKANE_CITIES)[number];

/**
 * The official PacketFlow drop-off point address for every Skåne municipality.
 *
 * The destination city's drop-off point is automatically assigned when a
 * package is created — the sender never picks it manually.
 * Carriers use this address as their delivery target.
 */
export const DROP_OFF_POINTS: Record<SkaneCity, string> = {
  Bjuv:          "PacketFlow Bjuv, Storgatan 12, 267 31 Bjuv",
  Bromölla:      "PacketFlow Bromölla, Järnvägsgatan 4, 295 31 Bromölla",
  Burlöv:        "PacketFlow Burlöv, Kronetorpsvägen 8, 232 37 Arlöv",
  Båstad:        "PacketFlow Båstad, Köpmansgatan 3, 269 31 Båstad",
  Eslöv:         "PacketFlow Eslöv, Stortorget 2, 241 30 Eslöv",
  Helsingborg:   "PacketFlow Helsingborg, Järnvägsgatan 14, 252 24 Helsingborg",
  Hässleholm:    "PacketFlow Hässleholm, Stationsgatan 22, 281 31 Hässleholm",
  Höganäs:       "PacketFlow Höganäs, Hamnvägen 5, 263 31 Höganäs",
  Hörby:         "PacketFlow Hörby, Stortorget 9, 242 30 Hörby",
  Höör:          "PacketFlow Höör, Ringvägen 1, 243 30 Höör",
  Klippan:       "PacketFlow Klippan, Trädgårdsgatan 7, 264 30 Klippan",
  Kristianstad:  "PacketFlow Kristianstad, Östra Boulevarden 33, 291 31 Kristianstad",
  Kävlinge:      "PacketFlow Kävlinge, Industrigatan 6, 244 31 Kävlinge",
  Landskrona:    "PacketFlow Landskrona, Rådhusgatan 11, 261 31 Landskrona",
  Lomma:         "PacketFlow Lomma, Hamngatan 2, 234 31 Lomma",
  Lund:          "PacketFlow Lund, Bangatan 8, 222 29 Lund",
  Malmö:         "PacketFlow Malmö, Centralplan 15, 211 20 Malmö",
  Osby:          "PacketFlow Osby, Storgatan 5, 283 31 Osby",
  Perstorp:      "PacketFlow Perstorp, Fabriksgatan 3, 284 30 Perstorp",
  Simrishamn:    "PacketFlow Simrishamn, Storgatan 24, 272 31 Simrishamn",
  Sjöbo:         "PacketFlow Sjöbo, Järnvägsgatan 10, 275 30 Sjöbo",
  Skurup:        "PacketFlow Skurup, Stortorget 1, 274 30 Skurup",
  Staffanstorp:  "PacketFlow Staffanstorp, Rådhusvägen 4, 245 31 Staffanstorp",
  Svalöv:        "PacketFlow Svalöv, Järnvägsgatan 2, 268 30 Svalöv",
  Svedala:       "PacketFlow Svedala, Storgatan 16, 233 31 Svedala",
  Tomelilla:     "PacketFlow Tomelilla, Göingevägen 3, 273 30 Tomelilla",
  Trelleborg:    "PacketFlow Trelleborg, Hamngatan 19, 231 41 Trelleborg",
  Vellinge:      "PacketFlow Vellinge, Norrevångsgatan 3, 235 31 Vellinge",
  Ystad:         "PacketFlow Ystad, Stortorget 7, 271 31 Ystad",
  Åstorp:        "PacketFlow Åstorp, Järnvägsgatan 8, 265 31 Åstorp",
  Ängelholm:     "PacketFlow Ängelholm, Järnvägsgatan 20, 262 32 Ängelholm",
  Örkelljunga:   "PacketFlow Örkelljunga, Stortorget 4, 286 30 Örkelljunga",
};

// ---------------------------------------------------------------------------
// Swedish vehicle registration plates
// ---------------------------------------------------------------------------

/**
 * Valid Swedish registration plate formats (matched against a normalised,
 * space-stripped, upper-cased value):
 * - Current (since 2019): 3 letters, 2 digits, 1 letter — e.g. `ABC 12D`
 * - Older:                3 letters, 3 digits           — e.g. `ABC 123`
 */
export const SWEDISH_PLATE_REGEX = /^[A-Z]{3}\d{2}[A-Z]$|^[A-Z]{3}\d{3}$/;

/** Upper-case and strip spaces / punctuation. */
export function normalizePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** True if `value` is a valid Swedish registration plate. */
export function isSwedishPlate(value: string): boolean {
  return SWEDISH_PLATE_REGEX.test(normalizePlate(value));
}

/** Format for display/input: a space after the first 3 letters, capped at 6 chars. */
export function formatPlate(value: string): string {
  const n = normalizePlate(value).slice(0, 6);
  return n.length > 3 ? `${n.slice(0, 3)} ${n.slice(3)}` : n;
}
