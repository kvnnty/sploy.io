'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Cable,
  CheckCircle2,
  CircleDashed,
  FlaskConical,
  Library,
  MenuIcon,
  NotebookTabs,
  PlusSquare,
  Settings2,
  Sparkles,
  User,
  Workflow,
} from 'lucide-react';

import Logo from '@/components/shared/logo';
import { Navbar } from '@/components/navbar/navbar';
import { NotificationProvider } from '@/components/notifications/notification-provider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { AuthMeResponse, TeamMembership } from '@/lib/api';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

import { TeamSwitcher } from './team-switcher';

const nav = [
  { href: '/dashboard', label: DASHBOARD_ROUTES.new.pageTitle, icon: PlusSquare },
  { href: '/dashboard/tasks', label: DASHBOARD_ROUTES.tasks.pageTitle, icon: Workflow },
  { href: '/dashboard/notebooks', label: DASHBOARD_ROUTES.notebooks.pageTitle, icon: NotebookTabs },
  { href: '/dashboard/library', label: DASHBOARD_ROUTES.library.pageTitle, icon: Library },
  { href: '/dashboard/data-connectors', label: DASHBOARD_ROUTES.dataConnectors.pageTitle, icon: Cable },
  { href: '/dashboard/custom-agents', label: DASHBOARD_ROUTES.customAgents.pageTitle, icon: Sparkles },
] as const;

const settingsNav = [
  { href: '/dashboard/settings/account', label: 'Account settings', icon: User },
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
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
            {label}
          </Link>
        );
      })}

      <div className="mt-4">
        <p className="mb-1.5 px-2.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
          Settings
        </p>
        {settingsNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DashboardLayout({
  children,
  userEmail,
  userName,
  me,
  teams,
  activeTeamId,
  apiAvailable,
}: {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
  me: AuthMeResponse;
  teams: TeamMembership[];
  activeTeamId: string | null;
  apiAvailable: boolean;
}) {
  const onboardingSteps = [
    { label: 'Connect your data', done: false },
    { label: 'Run an analysis', done: false },
    { label: 'Calibrate your analyst', done: false },
  ];

  return (
    <NotificationProvider>
      <div className="flex min-h-screen w-full flex-1 bg-background text-foreground">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card py-4 md:flex">
          <div className="px-4 pb-4">
            <Logo size="sm" />
          </div>
          <div className="px-4 pb-3">
            <p className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
              Team
            </p>
            <TeamSwitcher teams={teams} activeTeamId={activeTeamId} />
          </div>
          <NavLinks className="flex-1 px-3" />
          <div className="px-4 pb-4">
            <p className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
              Try
            </p>
            <div className="space-y-1 text-sm">
              <Link
                href="/dashboard/onboarding"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <FlaskConical className="size-4 shrink-0 opacity-80" aria-hidden />
                {DASHBOARD_ROUTES.onboarding.pageTitle}
              </Link>
              <Link
                href="/dashboard/models"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Settings2 className="size-4 shrink-0 opacity-80" aria-hidden />
                {DASHBOARD_ROUTES.models.pageTitle}
              </Link>
              <Link
                href="/dashboard/ask"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <BookOpen className="size-4 shrink-0 opacity-80" aria-hidden />
                {DASHBOARD_ROUTES.ask.pageTitle}
              </Link>
            </div>
          </div>
          <div className="mx-4 mb-4 rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-sm font-medium text-foreground">Unlock all of Sploy</p>
            <div className="mt-2 space-y-2">
              {onboardingSteps.map((step) => (
                <div key={step.label} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{step.label}</span>
                  {step.done ? (
                    <CheckCircle2 className="size-3.5 text-primary" />
                  ) : (
                    <CircleDashed className="size-3.5 text-muted-foreground/80" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-muted">
              <div className="h-full w-[5%] rounded-full bg-primary" />
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Navbar
            name={userName}
            email={userEmail}
            teams={teams}
            activeTeamId={activeTeamId}
            mobileMenu={
              <Sheet>
                <SheetTrigger
                  render={<Button variant="outline" size="icon" className="border-border bg-muted/40" />}
                >
                  <MenuIcon className="size-4 text-foreground" />
                  <span className="sr-only">Open menu</span>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(100%,280px)] border-border bg-card p-0">
                  <SheetHeader className="border-b border-border p-4 text-left">
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <Logo />
                  </SheetHeader>
                  <div className="p-4">
                    <p className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                      Team
                    </p>
                    <TeamSwitcher teams={teams} activeTeamId={activeTeamId} />
                  </div>
                  <NavLinks className="px-2 pb-4" />
                  <div className="mt-auto border-t border-border p-4">
                    <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                  </div>
                </SheetContent>
              </Sheet>
            }
          />

          {apiAvailable && !me.internalUserId ? (
            <div
              className="border-b border-primary/25 bg-primary/10 px-4 py-2 text-center text-xs text-muted-foreground"
              role="status"
            >
              Your account is not linked to the app yet. Complete workspace setup below.
            </div>
          ) : null}

          <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    </NotificationProvider>
  );
}
