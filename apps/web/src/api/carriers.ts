/**
 * Carriers API
 *
 * BACKEND CONTRACT:
 *   GET    /api/v1/carriers          -> Carrier[]
 *   PATCH  /api/v1/carriers/:id      body: Partial<Carrier>  -> Carrier
 */

import type { Carrier } from "@packetflow/types";

export async function listCarriers(): Promise<Carrier[]> {
  throw new Error("TODO: GET /api/v1/carriers");
}

export async function updateCarrier(_id: string, _patch: Partial<Omit<Carrier, "id">>): Promise<Carrier> {
  throw new Error("TODO: PATCH /api/v1/carriers/:id");
}
