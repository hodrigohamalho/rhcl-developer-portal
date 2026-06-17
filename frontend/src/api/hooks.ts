import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  ApiCredential,
  ApiProduct,
  Application,
  Plan,
  Profile,
  Subscription,
  SubscriptionResult,
  Usage,
} from "./types";

// ---- Catalog (public) ------------------------------------------------------
export const useApis = () =>
  useQuery({ queryKey: ["apis"], queryFn: () => api.get<ApiProduct[]>("/api/catalog/apis") });

export const useApi = (id: number) =>
  useQuery({ queryKey: ["api", id], queryFn: () => api.get<ApiProduct>(`/api/catalog/apis/${id}`) });

export const useApiPlans = (id: number) =>
  useQuery({ queryKey: ["api", id, "plans"], queryFn: () => api.get<Plan[]>(`/api/catalog/apis/${id}/plans`) });

export const usePlans = () =>
  useQuery({ queryKey: ["plans"], queryFn: () => api.get<Plan[]>("/api/plans") });

// ---- Me (consumer) ---------------------------------------------------------
export const useProfile = () =>
  useQuery({ queryKey: ["me"], queryFn: () => api.get<Profile>("/api/me") });

export const useApplications = () =>
  useQuery({ queryKey: ["applications"], queryFn: () => api.get<Application[]>("/api/me/applications") });

export const useSubscriptions = () =>
  useQuery({ queryKey: ["subscriptions"], queryFn: () => api.get<Subscription[]>("/api/me/subscriptions") });

export const useUsage = (subscriptionId?: number, days = 7) =>
  useQuery({
    queryKey: ["usage", subscriptionId, days],
    queryFn: () => api.get<Usage>(`/api/me/usage?subscriptionId=${subscriptionId}&days=${days}`),
    enabled: !!subscriptionId,
  });

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Application>) => api.post<Application>("/api/me/applications", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      apiProductId: number;
      applicationId: number;
      applicationPlanId: number;
      environment?: string;
      useCase?: string;
    }) => api.post<SubscriptionResult>("/api/me/subscriptions", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useRotateKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: number) =>
      api.post<ApiCredential>(`/api/me/subscriptions/${subscriptionId}/rotate-key`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

// ---- Admin -----------------------------------------------------------------
export const useAdminSubscriptions = (status?: string) =>
  useQuery({
    queryKey: ["admin", "subscriptions", status],
    queryFn: () =>
      api.get<Subscription[]>(`/api/admin/subscriptions${status ? `?status=${status}` : ""}`),
  });

export function useApproveSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<SubscriptionResult>(`/api/admin/subscriptions/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
  });
}

export function useRejectSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post<Subscription>(`/api/admin/subscriptions/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
  });
}

export function useSuspendSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<Subscription>(`/api/admin/subscriptions/${id}/suspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
  });
}

export function useCreateApi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ApiProduct>) => api.post<ApiProduct>("/api/admin/apis", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apis"] }),
  });
}

export function useUpdateApi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<ApiProduct> }) =>
      api.put<ApiProduct>(`/api/admin/apis/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apis"] }),
  });
}
