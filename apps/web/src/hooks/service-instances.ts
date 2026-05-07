'use client';

import { useMemo } from 'react';

import { useApiClient } from '@/components/providers/api-client-provider';
import { AuthService } from '@/services/auth.service';
import { NotificationService } from '@/services/notification.service';
import { SessionService } from '@/services/session.service';
import { TeamService } from '@/services/team.service';
import { UploadService } from '@/services/upload.service';
import { UserService } from '@/services/user.service';

export function useAuthService(): AuthService {
  const { axios } = useApiClient();
  return useMemo(() => new AuthService(axios), [axios]);
}

export function useTeamService(): TeamService {
  const { axios } = useApiClient();
  return useMemo(() => new TeamService(axios), [axios]);
}

export function useUserService(): UserService {
  const { axios } = useApiClient();
  return useMemo(() => new UserService(axios), [axios]);
}

export function useSessionService(): SessionService {
  const { axios } = useApiClient();
  return useMemo(() => new SessionService(axios), [axios]);
}

export function useUploadService(): UploadService {
  const { axios } = useApiClient();
  return useMemo(() => new UploadService(axios), [axios]);
}

export function useNotificationService(): NotificationService {
  const { axios } = useApiClient();
  return useMemo(() => new NotificationService(axios), [axios]);
}
