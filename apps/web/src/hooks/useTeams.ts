'use client';

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  useAuthService,
  useTeamService,
  useUploadService,
} from '@/hooks/service-instances';
import { queryKeys } from '@/lib/query-keys';
import type { CreateTeamBody } from '@/types';

export function useTeamDashboardQuery(enabled = true) {
  const teams = useTeamService();
  return useQuery({
    queryKey: queryKeys.team.detail(),
    queryFn: () => teams.getDashboard(),
    enabled,
  });
}

export function useTeamActivityQuery(enabled = true) {
  const teams = useTeamService();
  return useQuery({
    queryKey: queryKeys.team.activity(),
    queryFn: async () => {
      try {
        return await teams.getActivity();
      } catch {
        return [];
      }
    },
    enabled,
  });
}

/** Parallel team detail + activity (settings page). */
export function useTeamSettingsQueries() {
  const teams = useTeamService();
  return useQueries({
    queries: [
      {
        queryKey: queryKeys.team.detail(),
        queryFn: () => teams.getDashboard(),
      },
      {
        queryKey: queryKeys.team.activity(),
        queryFn: async () => {
          try {
            return await teams.getActivity();
          } catch {
            return [];
          }
        },
      },
    ],
  });
}

function invalidateTeamScope(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.team.root });
  void qc.invalidateQueries({ queryKey: queryKeys.auth.teams() });
}

export function useUpdateTeamMutation() {
  const teams = useTeamService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) => teams.updateTeam(body),
    onSuccess: () => invalidateTeamScope(qc),
  });
}

export function useUpdateTeamLogoMutation() {
  const teams = useTeamService();
  const uploads = useUploadService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      const { url } = await uploads.uploadTeamAvatar(fd);
      await teams.updateLogo({ logoUrl: url });
    },
    onSuccess: () => invalidateTeamScope(qc),
  });
}

export function useDeleteTeamMutation() {
  const teams = useTeamService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => teams.deleteTeam(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.auth.root });
      void qc.invalidateQueries({ queryKey: queryKeys.team.root });
    },
  });
}

export function useCreateTeamMutation() {
  const teams = useTeamService();
  const auth = useAuthService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: {
      body: CreateTeamBody;
      switchToNew?: boolean;
    }) => {
      const created = await teams.createTeam(opts.body);
      if (opts.switchToNew !== false) {
        try {
          await auth.switchTeam(created.id);
        } catch {
          /* best-effort */
        }
      }
      return created;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.auth.teams() });
      void qc.invalidateQueries({ queryKey: queryKeys.team.root });
    },
  });
}

export function useInviteTeamMemberMutation() {
  const teams = useTeamService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; role: string }) =>
      teams.inviteMember(body),
    onSuccess: () => invalidateTeamScope(qc),
  });
}

export function useRespondTeamInviteMutation() {
  const teams = useTeamService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: {
      action: 'accept' | 'decline';
      invitationId: string;
    }) => teams.respondToInvite(opts.action, opts.invitationId),
    onSuccess: () => invalidateTeamScope(qc),
  });
}

export function useUpdateMemberRoleMutation() {
  const teams = useTeamService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: { memberId: string; role: string }) =>
      teams.updateRole(opts.memberId, opts.role),
    onSuccess: () => invalidateTeamScope(qc),
  });
}

export function useRemoveTeamMemberMutation() {
  const teams = useTeamService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => teams.removeMember(memberId),
    onSuccess: () => invalidateTeamScope(qc),
  });
}

export function useTransferTeamOwnershipMutation() {
  const teams = useTeamService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => teams.transferOwnership(memberId),
    onSuccess: () => invalidateTeamScope(qc),
  });
}

export function useResendTeamInviteMutation() {
  const teams = useTeamService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => teams.resendInvite(inviteId),
    onSuccess: () => invalidateTeamScope(qc),
  });
}

export function useCancelTeamInviteMutation() {
  const teams = useTeamService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => teams.cancelInvite(inviteId),
    onSuccess: () => invalidateTeamScope(qc),
  });
}
