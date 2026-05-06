'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserService } from '@/hooks/service-instances';
import { queryKeys } from '@/lib/query-keys';

export function useUpdateProfileMutation() {
  const user = useUserService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { displayName: string }) =>
      user.updateProfile(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.user.root });
      void qc.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}

export function useDeleteAccountMutation() {
  const user = useUserService();
  return useMutation({
    mutationFn: () => user.deleteAccount(),
  });
}
