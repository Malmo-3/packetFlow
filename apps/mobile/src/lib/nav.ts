import type { Role } from "@packetflow/types";

/** The landing tab for each role after login (mobile supports sender/recipient/carrier). */
export function roleHome(role: Role | undefined): string {
  switch (role) {
    case "sender":
      return "/(tabs)/home";
    case "recipient":
      return "/(tabs)/saved";
    case "carrier":
      return "/(tabs)/shift";
    default:
      // Admin is web-only; send any other role to a safe, always-visible screen.
      return "/(tabs)/profile";
  }
}
