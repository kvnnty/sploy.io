import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import {
  apiFetchServer,
  type AuthMeResponse,
  type OrgMembership,
} from '@/lib/api';
import { ACTIVE_ORG_COOKIE } from '@/lib/dashboard-constants';
import { createClient } from '@/lib/supabase/server';

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
  accessToken: string;
  me: AuthMeResponse;
  orgs: OrgMembership[];
  activeOrgId: string | null;
  apiAvailable: boolean;
};

export const loadDashboardData = cache(async (): Promise<DashboardLoadResult> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) redirect('/auth/login');

  let me: AuthMeResponse = {
    authUserId: user.id,
    email: user.email ?? '',
    internalUserId: null,
    activeOrgId: null,
    role: null,
  };
  let orgs: OrgMembership[] = [];
  let apiAvailable = false;

  try {
    me = await apiFetchServer<AuthMeResponse>('/auth/me', session.access_token);
    apiAvailable = true;
    if (me.internalUserId) {
      try {
        orgs = await apiFetchServer<OrgMembership[]>(
          '/auth/orgs',
          session.access_token,
        );
      } catch {
        orgs = [];
      }
    }
  } catch {
    apiAvailable = false;
  }

  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const activeOrgId = pickOrgId(me, orgs, cookieOrg);

  return {
    user: { id: user.id, email: user.email },
    accessToken: session.access_token,
    me,
    orgs,
    activeOrgId,
    apiAvailable,
  };
});
