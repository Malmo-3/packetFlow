/**
 * React Query hooks for the Trips and Users (carrier list) resources.
 *
 * - `useTrips` / `useTripById` — admin view (all trips)
 * - `useMyTrips`               — carrier view (own trips only, via `GET /trips/my`)
 * - `useCarrierUsers`          — admin dropdown for carrier assignment
 * - `useCreateTrip` / `useUpdateTrip` / `useDeleteTrip` — admin mutations
 * - `useUpdateTripStatus`      — carrier mutation (forward-only status advance)
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tripsApi, usersApi, type BackendTrip, type CreateTripInput, type UpdateTripInput, type TripStatus, type BackendUser } from "@packetflow/backend-client";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const tripKeys = {
  all: ["trips"] as const,
  lists: () => [...tripKeys.all, "list"] as const,
  mine: () => [...tripKeys.all, "mine"] as const,
  detail: (id: string) => [...tripKeys.all, "detail", id] as const,
};

export const userKeys = {
  carriers: ["users", "carriers"] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useTrips() {
  return useQuery<BackendTrip[]>({
    queryKey: tripKeys.lists(),
    queryFn: ({ signal }) => tripsApi.listTrips(signal),
  });
}

/** Carrier-scoped: fetches GET /trips/my — only trips assigned to the calling carrier */
export function useMyTrips() {
  return useQuery<BackendTrip[]>({
    queryKey: tripKeys.mine(),
    queryFn: ({ signal }) => tripsApi.listMyTrips(signal),
  });
}

export function useTripById(id: string) {
  return useQuery<BackendTrip>({
    queryKey: tripKeys.detail(id),
    queryFn: ({ signal }) => tripsApi.getTripById(id, signal),
    enabled: Boolean(id),
  });
}

/** Fetch all users with role=carrier — used by admin to populate assignment dropdowns. */
export function useCarrierUsers() {
  return useQuery<BackendUser[]>({
    queryKey: userKeys.carriers,
    queryFn: ({ signal }) => usersApi.listUsers("carrier", signal),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation<BackendTrip, Error, CreateTripInput>({
    mutationFn: (input) => tripsApi.createTrip(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.lists() }),
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation<BackendTrip, Error, { id: string; patch: UpdateTripInput }>({
    mutationFn: ({ id, patch }) => tripsApi.updateTrip(id, patch),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: tripKeys.lists() });
      qc.invalidateQueries({ queryKey: tripKeys.detail(updated._id) });
    },
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => tripsApi.deleteTrip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.lists() }),
  });
}

/** Carrier: advance a trip's status forward */
export function useUpdateTripStatus() {
  const qc = useQueryClient();
  return useMutation<BackendTrip, Error, { id: string; status: TripStatus }>({
    mutationFn: ({ id, status }) => tripsApi.updateTripStatus(id, status),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: tripKeys.mine() });
      qc.invalidateQueries({ queryKey: tripKeys.detail(updated._id) });
    },
  });
}
