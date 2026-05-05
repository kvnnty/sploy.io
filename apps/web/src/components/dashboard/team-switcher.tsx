'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

import type { TeamMembership } from '@/lib/api';
import { apiFetchWithToken } from '@/lib/api';
import { ACTIVE_TEAM_COOKIE } from '@/lib/dashboard-constants';
import { TeamAvatar } from '@/components/shared/team-avatar';
import { CreateTeamDialog } from './create-team-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TeamSwitcher({
  teams,
  activeTeamId,
}: {
  teams: TeamMembership[];
  activeTeamId: string | null;
}) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  const active = teams.find((t) => t.team_id === activeTeamId) ?? teams[0];

  async function handleSwitch(teamId: string) {
    if (teamId === activeTeamId) return;
    setSwitching(true);
    try {
      const token = await getToken();
      if (token) {
        await apiFetchWithToken('/auth/switch-team', token, {
          method: 'POST',
          body: JSON.stringify({ teamId }),
        });
      }
    } catch {
      // best-effort
    }
    document.cookie = `${ACTIVE_TEAM_COOKIE}=${encodeURIComponent(teamId)}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
    setSwitching(false);
  }

  if (!active) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={switching}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-left text-xs text-foreground outline-none transition hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <TeamAvatar
          name={active.name}
          logoUrl={active.logoUrl}
          size="sm"
        />
        <span className="min-w-0 flex-1 truncate">{active.name}</span>
        {teams.length > 1 && (
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        {teams.map((t) => (
          <DropdownMenuItem
            key={t.team_id}
            onClick={() => handleSwitch(t.team_id)}
            className="flex items-center gap-2"
          >
            <TeamAvatar
              name={t.name}
              logoUrl={t.logoUrl}
              size="sm"
            />
            <span className="min-w-0 flex-1 truncate text-sm">{t.name}</span>
            {t.team_id === activeTeamId && (
              <Check className="size-3.5 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <CreateTeamDialog
          trigger={
            <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground">
              <Plus className="size-3.5" />
              New Team
            </button>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
