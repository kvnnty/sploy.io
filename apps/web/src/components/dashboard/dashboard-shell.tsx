'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MenuIcon,
  MessageSquareText,
  Database,
} from 'lucide-react';

import Logo from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { AuthMeResponse, OrgMembership } from '@/lib/api';

import { OrgSwitcher } from './org-switcher';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/data-sources', label: 'Data sources', icon: Database },
  { href: '/dashboard/ask', label: 'Ask', icon: MessageSquareText },
] as const;

function NavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn('flex flex-col gap-0.5', className)}>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
              active
                ? 'bg-white/10 text-foreground'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  children,
  userEmail,
  me,
  orgs,
  activeOrgId,
  apiAvailable,
}: {
  children: React.ReactNode;
  userEmail: string;
  me: AuthMeResponse;
  orgs: OrgMembership[];
  activeOrgId: string | null;
  apiAvailable: boolean;
}) {
  return (
    <div className="flex min-h-screen w-full flex-1">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/10 bg-card/80 py-4 backdrop-blur-md md:flex">
        <div className="px-3 pb-4">
          <Logo />
        </div>
        <div className="px-3 pb-3">
          <p className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
            Organization
          </p>
          <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} />
        </div>
        <NavLinks className="flex-1 px-2" />
        <div className="mt-auto space-y-2 border-t border-white/10 px-3 pt-4">
          <p className="truncate px-1 text-xs text-muted-foreground" title={userEmail}>
            {userEmail}
          </p>
          <Link
            href="/logout"
            className="block rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            Sign out
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-background/90 px-4 py-3 backdrop-blur-md md:hidden">
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="icon" className="border-white/10 bg-white/5" />}
            >
              <MenuIcon className="size-4" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100%,280px)] border-white/10 bg-card p-0">
              <SheetHeader className="border-b border-white/10 p-4 text-left">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Logo />
              </SheetHeader>
              <div className="p-4">
                <p className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                  Organization
                </p>
                <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} />
              </div>
              <NavLinks className="px-2 pb-4" />
              <div className="mt-auto border-t border-white/10 p-4">
                <p className="mb-2 truncate text-xs text-muted-foreground">{userEmail}</p>
                <Link
                  href="/logout"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Sign out
                </Link>
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium text-foreground">Sploy</span>
        </header>

        {!apiAvailable ? (
          <div
            className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200/90"
            role="status"
          >
            Cannot reach the Sploy API. Confirm{' '}
            <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[0.7rem]">
              NEXT_PUBLIC_API_URL
            </code>{' '}
            and that the backend is running.
          </div>
        ) : null}

        {apiAvailable && !me.internalUserId ? (
          <div
            className="border-b border-sky-500/20 bg-sky-500/10 px-4 py-2 text-center text-xs text-sky-100/90"
            role="status"
          >
            Your account is not linked to the app yet. Complete workspace setup below.
          </div>
        ) : null}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
