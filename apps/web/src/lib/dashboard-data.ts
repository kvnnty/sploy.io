import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';

import {
  apiFetchServer,
  type AuthMeResponse,
  type OrgMembership,
} from '@/lib/api';
import { ACTIVE_ORG_COOKIE } from '@/lib/dashboard-constants';

function pickOrgId(
  me: AuthMeResponse,
  orgs: OrgMembership[],
  cookieVal: string | undefined,
): string | null {
  if (!orgs.length) return null;
  const ids = new Set(orgs.map((o) => o.org_id));
  if (cookieVal && ids.has(cookieVal)) return cookieVal;
  if (me.activeOrgId && ids.has(me.activeOrgId)) return me.activeOrgId;
  return orgs[0].org_id;
}

export type DashboardLoadResult = {
  user: { id: string; email?: string };
  accessToken: string | null;
  me: AuthMeResponse;
  orgs: OrgMembership[];
  activeOrgId: string | null;
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
    activeOrgId: null,
    role: null,
  };
  let orgs: OrgMembership[] = [];
  let apiAvailable = false;

  if (accessToken) {
    try {
      me = await apiFetchServer<AuthMeResponse>('/auth/me', accessToken);
      apiAvailable = true;
      if (me.internalUserId) {
        try {
          orgs = await apiFetchServer<OrgMembership[]>(
            '/auth/orgs',
            accessToken,
          );
        } catch {
          orgs = [];
        }
      }
    } catch {
      apiAvailable = false;
    }
  }

  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const activeOrgId = pickOrgId(me, orgs, cookieOrg);

  return {
    user: { id: user.id, email: user.emailAddresses[0]?.emailAddress },
    accessToken,
    me,
    orgs,
    activeOrgId,
    apiAvailable,
  };
});
