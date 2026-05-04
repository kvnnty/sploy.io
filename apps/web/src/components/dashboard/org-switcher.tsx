'use client';

import { useRouter } from 'next/navigation';

import type { OrgMembership } from '@/lib/api';
import { ACTIVE_ORG_COOKIE } from '@/lib/dashboard-constants';

export function OrgSwitcher({
  orgs,
  activeOrgId,
}: {
  orgs: OrgMembership[];
  activeOrgId: string | null;
}) {
  const router = useRouter();

  if (orgs.length <= 1) {
    const only = orgs[0];
    if (!only) return null;
    return (
      <p className="truncate px-2 text-xs text-muted-foreground" title={only.name}>
        {only.name}
      </p>
    );
  }

  return (
    <>
      <label className="sr-only" htmlFor="org-switch">
        Organization
      </label>
      <select
        id="org-switch"
        value={activeOrgId ?? ''}
        onChange={(e) => {
          const id = e.target.value;
          document.cookie = `${ACTIVE_ORG_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`;
          router.refresh();
        }}
        className="w-full rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {orgs.map((o) => (
          <option key={o.org_id} value={o.org_id}>
            {o.name}
          </option>
        ))}
      </select>
    </>
  );
}
