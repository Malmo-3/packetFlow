/**
 * Carriers API — wired to the backend Carrier directory.
 *
 *   GET    /api/v1/carriers        -> BackendCarrier[]          (admin)
 *   PATCH  /api/v1/carriers/:id    body: Partial<Carrier>       (admin)
 *
 * Backend `_id` is mapped to the app's `Carrier {id}` shape.
 */

import { request } from "@packetflow/backend-client";
import type { Carrier } from "@packetflow/types";

interface BackendCarrier {
  _id: string;
  name: string;
  vehicle: string;
  phone: string;
  active: boolean;
}

const toCarrier = (c: BackendCarrier): Carrier => ({
  id: c._id,
  name: c.name,
  vehicle: c.vehicle,
  phone: c.phone,
  active: c.active,
});

export async function listCarriers(): Promise<Carrier[]> {
  const carriers = await request<BackendCarrier[]>("/carriers");
  return carriers.map(toCarrier);
}

export async function updateCarrier(
  id: string,
  patch: Partial<Omit<Carrier, "id">>,
): Promise<Carrier> {
  const updated = await request<BackendCarrier>(`/carriers/${id}`, {
    method: "PATCH",
    body: patch as Record<string, unknown>,
  });
  return toCarrier(updated);
}
