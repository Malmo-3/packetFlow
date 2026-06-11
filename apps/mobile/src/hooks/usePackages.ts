import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPackage,
  getPackageById,
  getPackageByCode,
  listPackages,
  type CreatePackageInput,
  type PackageView,
} from "../api/packages";

export const packageKeys = {
  all: ["packages"] as const,
  detail: (id: string) => ["packages", "detail", id] as const,
  byCode: (code: string) => ["packages", "code", code] as const,
};

/** All packages visible to the current user (server filters by role). */
export function usePackages() {
  return useQuery<PackageView[]>({
    queryKey: packageKeys.all,
    queryFn: ({ signal }) => listPackages(signal),
  });
}

/** Sender-scoped: only packages created by this sender. */
export function useSenderPackages(senderId?: string) {
  return useQuery<PackageView[]>({
    queryKey: [...packageKeys.all, "sender", senderId ?? "none"],
    queryFn: async ({ signal }) => {
      const all = await listPackages(signal);
      return senderId ? all.filter((p) => p.senderId === senderId) : all;
    },
  });
}

export function usePackage(id?: string) {
  return useQuery<PackageView>({
    queryKey: id ? packageKeys.detail(id) : packageKeys.all,
    queryFn: ({ signal }) => getPackageById(id!, signal),
    enabled: Boolean(id),
    // Poll so a recipient sees status changes (e.g. delivered) without reopening.
    refetchInterval: 20_000,
  });
}

export function usePackageByCode(code?: string) {
  return useQuery<PackageView | undefined>({
    queryKey: code ? packageKeys.byCode(code) : packageKeys.all,
    queryFn: ({ signal }) => getPackageByCode(code!, signal),
    enabled: Boolean(code && code.trim()),
  });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePackageInput) => createPackage(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: packageKeys.all }),
  });
}
