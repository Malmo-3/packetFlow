import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { carrierApi, type ShiftState } from "@packetflow/backend-client";

export const carrierKeys = {
  shift: ["carrier", "shift"] as const,
  me: ["carrier", "me"] as const,
  history: ["carrier", "history"] as const,
  tripPackages: (tripId: string) => ["carrier", "trip", tripId, "packages"] as const,
};

/** The carrier's own profile (includes the unique carrier id). */
export function useCarrierMe(enabled = true) {
  return useQuery({
    queryKey: carrierKeys.me,
    queryFn: ({ signal }) => carrierApi.getMe(signal),
    enabled,
  });
}

/** The carrier's session history (trips + delivery counts). */
export function useCarrierHistory(enabled = true) {
  return useQuery({
    queryKey: carrierKeys.history,
    queryFn: ({ signal }) => carrierApi.getHistory(signal),
    enabled,
  });
}

export function useUpdateCarrierProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { fullName?: string; phone?: string; vehicle?: string }) =>
      carrierApi.updateProfile(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: carrierKeys.me }),
  });
}

export function useDeleteCarrierAccount() {
  return useMutation({ mutationFn: () => carrierApi.deleteAccount() });
}

/** Current shift state + the carrier's planned/active trip. */
export function useShift() {
  return useQuery<ShiftState>({
    queryKey: carrierKeys.shift,
    queryFn: ({ signal }) => carrierApi.getShift(signal),
    refetchInterval: 20_000,
  });
}

/** Packages on a given trip (carrier-scoped). */
export function useTripPackages(tripId?: string) {
  return useQuery({
    queryKey: tripId ? carrierKeys.tripPackages(tripId) : ["carrier", "trip", "none"],
    queryFn: ({ signal }) => carrierApi.getTripPackages(tripId!, signal),
    enabled: Boolean(tripId),
  });
}

function useCarrierMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carrierKeys.shift });
      qc.invalidateQueries({ queryKey: ["carrier", "trip"] });
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

export const useStartShift = () => useCarrierMutation<void>(() => carrierApi.startShift());
export const useEndShift = () => useCarrierMutation<void>(() => carrierApi.endShift());
export const useAcceptTrip = () => useCarrierMutation<string>((id) => carrierApi.acceptTrip(id));
export const useCheckInTrip = () => useCarrierMutation<string>((id) => carrierApi.checkIn(id));
export const useAdvanceTrip = () => useCarrierMutation<string>((id) => carrierApi.advanceTrip(id));
export const useCheckOutTrip = () => useCarrierMutation<string>((id) => carrierApi.checkOut(id));
export const useScanPackage = () =>
  useCarrierMutation<{ tripId: string; packageId: string; scanCode: string }>(({ tripId, packageId, scanCode }) =>
    carrierApi.scanPackage(tripId, packageId, scanCode),
  );
