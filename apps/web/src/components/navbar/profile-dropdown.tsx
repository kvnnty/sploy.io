'use client';

import { useUser } from '@clerk/nextjs';
import { LogOut, Settings, ShieldCheck, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function initialsFor(name: string, email: string): string {
  const base = name.trim() || email.trim();
  if (!base) return 'U';
  const words = base.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export function ProfileDropdown({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const { user } = useUser();
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const initials = useMemo(() => initialsFor(name, email), [name, email]);
  const avatarUrl = user?.imageUrl ?? null;

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Logout failed');
      router.push('/auth/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full bg-card outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open account menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-10 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-72 min-w-72 p-2">
        <div className="mb-2">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="size-10 shrink-0 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{name || 'User'}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-sm font-medium text-foreground">
            Theme
          </DropdownMenuLabel>
          <DropdownMenuItem
            closeOnClick={false}
            className="cursor-default flex-col items-stretch gap-0 bg-transparent px-2 py-1.5 focus:bg-transparent data-highlighted:bg-transparent data-highlighted:[&_button[aria-pressed='false']]:text-muted-foreground data-highlighted:[&_button[aria-pressed='true']]:text-foreground"
          >
            <ThemeToggle labeled className="w-full" />
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="gap-2 px-2 py-2"
            onClick={() => router.push('/dashboard/settings/account')}
          >
            <Settings className="size-4" aria-hidden />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 px-2 py-2"
            onClick={() => router.push('/dashboard/settings/security')}
          >
            <ShieldCheck className="size-4" aria-hidden />
            Security
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 px-2 py-2"
            onClick={() => router.push('/dashboard/settings/team')}
          >
            <Users className="size-4" aria-hidden />
            Team
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          variant="destructive"
          className="gap-2 px-2 py-2"
          disabled={loggingOut}
          onClick={() => void handleLogout()}
        >
          <LogOut className="size-4" aria-hidden />
          {loggingOut ? 'Signing out…' : 'Logout'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
