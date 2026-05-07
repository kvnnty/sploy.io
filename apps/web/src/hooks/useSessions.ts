'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSessionService } from '@/hooks/service-instances';
import { queryKeys } from '@/lib/query-keys';

export function useSessionsQuery(options?: { enabled?: boolean }) {
  const sessions = useSessionService();
  return useQuery({
    queryKey: queryKeys.sessions.list(),
    queryFn: () => sessions.list(),
    enabled: options?.enabled ?? true,
  });
}

export function useRevokeSessionMutation() {
  const sessions = useSessionService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessions.revoke(sessionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.sessions.list() });
    },
  });
}

export function useRevokeOtherSessionsMutation() {
  const sessions = useSessionService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sessions.revokeOthers(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.sessions.list() });
    },
  });
}
