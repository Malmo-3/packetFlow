/**
 * React Query hooks for the Packages resource.
 *
 * All hooks share the `["packages"]` query key family — any mutation
 * automatically invalidates list and detail caches so the UI stays in sync.
 */
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";

import {
  arriveAtDropOff,
  createPackage,
  deletePackage,
  getPackageById,
  getPackageByCode,
  listPackages,
  markPickedUp,
  updatePackage,
  type CreatePackageInput,
  type UpdatePackageInput,
} from "../packages";
import type { Package } from "@packetflow/types";

export const packageKeys = {
  all: ["packages"] as const,
  lists: () => [...packageKeys.all, "list"] as const,
  detail: (id: string) => [...packageKeys.all, "detail", id] as const,
  byCode: (code: string) => [...packageKeys.all, "by-code", code.toLowerCase()] as const,
};

/**
 * Fetch all packages visible to the current user.
 * Results are filtered server-side by role (sender → own, carrier → trip packages, admin → all).
 */
export function usePackages(options?: Omit<UseQueryOptions<Package[]>, "queryKey" | "queryFn">) {
  return useQuery<Package[]>({
    queryKey: packageKeys.lists(),
    queryFn: ({ signal }) => listPackages(signal),
    ...options,
  });
}

/**
 * Fetches all packages visible to the current user.
 * Server-side sender filtering isn't implemented yet — the backend returns all
 * packages to authenticated users. Once the backend adds a `senderId` query
 * param filter, this hook can pass it through.
 */
export function useSenderPackages(senderId: string | undefined) {
  return useQuery<Package[]>({
    queryKey: [...packageKeys.lists(), { senderId }],
    queryFn: ({ signal }) => listPackages(signal),
    enabled: Boolean(senderId),
    // No client-side filter: senderId is not persisted server-side yet,
    // so filtering here would hide all packages after a page refresh.
  });
}

/** Fetch a single package by MongoDB `_id`. Disabled when `id` is undefined. */
export function usePackage(id: string | undefined) {
  return useQuery<Package>({
    queryKey: id ? packageKeys.detail(id) : packageKeys.all,
    queryFn: ({ signal }) => getPackageById(id!, signal),
    enabled: Boolean(id),
  });
}

/** Fetch a package by its public tracking code (e.g. `PF-AB12-CD34`). Used by the public tracking page. */
export function usePackageByCode(code: string | undefined) {
  return useQuery<Package | undefined>({
    queryKey: code ? packageKeys.byCode(code) : packageKeys.all,
    queryFn: ({ signal }) => getPackageByCode(code!, signal),
    enabled: Boolean(code && code.trim()),
  });
}

/** Create a new package. Primes the detail cache and invalidates the list. */
export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePackageInput) => createPackage(input),
    onSuccess: (created) => {
      qc.setQueryData<Package>(packageKeys.detail(created.id), created);
      qc.invalidateQueries({ queryKey: packageKeys.all });
    },
  });
}

/** Update package fields. Admins may change any field; carriers may only advance `status`. */
export function useUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdatePackageInput }) => updatePackage(id, patch),
    onSuccess: (updated) => {
      qc.setQueryData<Package>(packageKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: packageKeys.all });
    },
  });
}

/** Delete a package. Admin only. Removes detail cache entry and invalidates the list. */
export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: (_void, id) => {
      qc.removeQueries({ queryKey: packageKeys.detail(id) });
      qc.invalidateQueries({ queryKey: packageKeys.all });
    },
  });
}

/**
 * Carrier action: mark arrival at the drop-off point.
 * Transitions `in_transit` → `out_for_delivery` and triggers notifications.
 */
export function useArriveAtDropOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => arriveAtDropOff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: packageKeys.all }),
  });
}

/**
 * Carrier action: mark package as picked up by the recipient.
 * Transitions `out_for_delivery` → `delivered` and notifies the sender.
 */
export function useMarkPickedUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markPickedUp(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: packageKeys.all }),
  });
}
