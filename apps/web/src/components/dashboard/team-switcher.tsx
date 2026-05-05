'use client';

import { useRouter } from 'next/navigation';

import type { TeamMembership } from '@/lib/api';
import { ACTIVE_TEAM_COOKIE } from '@/lib/dashboard-constants';

export function TeamSwitcher({
  teams,
  activeTeamId,
}: {
  teams: TeamMembership[];
  activeTeamId: string | null;
}) {
  const router = useRouter();

  if (teams.length <= 1) {
    const only = teams[0];
    if (!only) return null;
    return (
      <p className="truncate px-2 text-xs text-muted-foreground" title={only.name}>
        {only.name}
      </p>
    );
  }

  return (
    <>
      <label className="sr-only" htmlFor="team-switch">
        Team
      </label>
      <select
        id="team-switch"
        value={activeTeamId ?? ''}
        onChange={(e) => {
          const id = e.target.value;
          document.cookie = `${ACTIVE_TEAM_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`;
          router.refresh();
        }}
        className="w-full rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {teams.map((t) => (
          <option key={t.team_id} value={t.team_id}>
            {t.name}
          </option>
        ))}
      </select>
    </>
  );
}
