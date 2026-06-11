/**
 * Carrier applications — a prospective carrier submits an application that an
 * admin must approve before a carrier account is created and they can log in.
 *
 *   POST /api/v1/carrier-applications   (public submit)
 */
import { request } from "@packetflow/backend-client";

export interface CarrierApplicationInput {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  vehicle: string;
  address?: string;
}

export async function submitCarrierApplication(input: CarrierApplicationInput): Promise<void> {
  await request("/carrier-applications", { method: "POST", body: input });
}
