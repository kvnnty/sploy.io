'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { useAuthService } from '@/hooks/service-instances';
import type { BootstrapPayload } from '@/types';

export function useSwitchTeamMutation() {
  const auth = useAuthService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => auth.switchTeam(teamId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.auth.root });
      void qc.invalidateQueries({ queryKey: queryKeys.team.root });
    },
  });
}

export function useBootstrapMutation() {
  const auth = useAuthService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BootstrapPayload) => auth.bootstrap(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.auth.root });
      void qc.invalidateQueries({ queryKey: queryKeys.team.root });
    },
  });
}

export function useConnectedAccountsQuery() {
  const auth = useAuthService();
  return useQuery({
    queryKey: queryKeys.auth.providers(),
    queryFn: () => auth.listProviders(),
  });
}

export function useConnectProviderMutation() {
  const auth = useAuthService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => auth.connectProvider(provider),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.auth.providers() });
    },
  });
}

export function useDisconnectProviderMutation() {
  const auth = useAuthService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => auth.disconnectProvider(provider),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.auth.providers() });
    },
  });
}
