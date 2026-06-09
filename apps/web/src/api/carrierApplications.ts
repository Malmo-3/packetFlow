/**
 * Carrier applications API — wired to the backend.
 *
 *   POST  /api/v1/carrier-applications                 (public submit)
 *   GET   /api/v1/carrier-applications?status=pending  (admin)
 *   PATCH /api/v1/carrier-applications/:id/approve      (admin)
 *   PATCH /api/v1/carrier-applications/:id/reject       (admin)
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

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface CarrierApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  vehicle: string;
  address?: string;
  status: ApplicationStatus;
  createdAt: string;
}

interface BackendApplication {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  vehicle: string;
  address?: string;
  status: ApplicationStatus;
  createdAt: string;
}

const toApplication = (a: BackendApplication): CarrierApplication => ({
  id: a._id,
  fullName: a.fullName,
  email: a.email,
  phone: a.phone,
  vehicle: a.vehicle,
  address: a.address,
  status: a.status,
  createdAt: a.createdAt,
});

export async function submitCarrierApplication(
  input: CarrierApplicationInput,
): Promise<void> {
  await request("/carrier-applications", { method: "POST", body: input });
}

export async function listCarrierApplications(
  status?: ApplicationStatus,
): Promise<CarrierApplication[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const apps = await request<BackendApplication[]>(`/carrier-applications${qs}`);
  return apps.map(toApplication);
}

export async function approveCarrierApplication(id: string): Promise<void> {
  await request(`/carrier-applications/${id}/approve`, { method: "PATCH" });
}

export async function rejectCarrierApplication(id: string): Promise<void> {
  await request(`/carrier-applications/${id}/reject`, { method: "PATCH" });
}
