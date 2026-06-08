/**
 * Delivery estimation helper.
 *
 * Returns the server-provided ETA if available.
 * TODO: once the API exposes route data, fall back to estimating from
 * route checkpoint count (GET /api/v1/routes/:id).
 */

import type { Package } from "@packetflow/types";

/**
 * Returns an ISO date string for the estimated delivery of `pkg`, or
 * `undefined` if no ETA is available.
 */
export function estimateDelivery(pkg: Package): string | undefined {
  return pkg.estimatedDelivery ?? undefined;
}
