/**
 * React Query hooks for the Deliveries resource.
 *
 * Deliveries link packages to trips (and therefore carriers). Writes are admin-only.
 * Mutations also invalidate `["packages"]` because creating or assigning a delivery
 * stamps the package's `status` and `delivery` fields.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deliveriesApi,
  type BackendDelivery,
  type CreateDeliveryInput,
} from "@packetflow/backend-client";

export const deliveryKeys = {
  all: ["deliveries"] as const,
  lists: () => [...deliveryKeys.all, "list"] as const,
  unassigned: () => [...deliveryKeys.all, "unassigned"] as const,
  detail: (id: string) => [...deliveryKeys.all, "detail", id] as const,
};

export function useDeliveries() {
  return useQuery<BackendDelivery[]>({
    queryKey: deliveryKeys.lists(),
    queryFn: ({ signal }) => deliveriesApi.listDeliveries(undefined, signal),
  });
}

export function useUnassignedDeliveries() {
  return useQuery<BackendDelivery[]>({
    queryKey: deliveryKeys.unassigned(),
    queryFn: ({ signal }) => deliveriesApi.listUnassignedDeliveries(signal),
  });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation<BackendDelivery, Error, CreateDeliveryInput>({
    mutationFn: (input) => deliveriesApi.createDelivery(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryKeys.all });
      // Package list also changes (delivery field stamped on package)
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

export function useAssignTripToDelivery() {
  const qc = useQueryClient();
  return useMutation<BackendDelivery, Error, { deliveryId: string; tripId: string }>({
    mutationFn: ({ deliveryId, tripId }) =>
      deliveriesApi.assignTripToDelivery(deliveryId, tripId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryKeys.all });
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}
