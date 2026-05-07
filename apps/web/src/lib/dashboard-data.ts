import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';

import { apiFetchServer } from '@/lib/api-server';
import type { AuthMeResponse, TeamMembership } from '@/types';
import { ACTIVE_TEAM_COOKIE } from '@/lib/dashboard-constants';

function pickTeamId(
  me: AuthMeResponse,
  teams: TeamMembership[],
  cookieVal: string | undefined,
): string | null {
  if (!teams.length) return null;
  const ids = new Set(teams.map((t) => t.team_id));
  if (cookieVal && ids.has(cookieVal)) return cookieVal;
  if (me.activeTeamId && ids.has(me.activeTeamId)) return me.activeTeamId;
  return teams[0].team_id;
}

export type DashboardLoadResult = {
  user: { id: string; email?: string; name?: string; imageUrl?: string };
  accessToken: string | null;
  me: AuthMeResponse;
  teams: TeamMembership[];
  activeTeamId: string | null;
  apiAvailable: boolean;
};

export const loadDashboardData = cache(async (): Promise<DashboardLoadResult> => {
  const user = await currentUser();
  if (!user) redirect('/auth/login');

  const { getToken } = await auth();
  const accessToken = await getToken();

  let me: AuthMeResponse = {
    authUserId: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? '',
    internalUserId: null,
    activeTeamId: null,
    role: null,
  };
  let teams: TeamMembership[] = [];
  let apiAvailable = false;

  if (accessToken) {
    try {
      me = await apiFetchServer<AuthMeResponse>('/auth/me', accessToken);
      apiAvailable = true;
      if (me.internalUserId) {
        try {
          teams = await apiFetchServer<TeamMembership[]>(
            '/auth/teams',
            accessToken,
          );
        } catch {
          teams = [];
        }
      }
    } catch {
      apiAvailable = false;
    }
  }

  const cookieStore = await cookies();
  const cookieTeam = cookieStore.get(ACTIVE_TEAM_COOKIE)?.value;
  const activeTeamId = pickTeamId(me, teams, cookieTeam);

  return {
    user: {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || undefined,
      imageUrl: user.imageUrl,
    },
    accessToken,
    me,
    teams,
    activeTeamId,
    apiAvailable,
  };
});
