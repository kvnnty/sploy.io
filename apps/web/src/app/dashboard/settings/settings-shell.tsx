'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/dashboard/settings/account', label: DASHBOARD_ROUTES.settingsAccount.pageTitle },
  { href: '/dashboard/settings/security', label: DASHBOARD_ROUTES.settingsSecurity.pageTitle },
  { href: '/dashboard/settings/team', label: DASHBOARD_ROUTES.settingsTeam.pageTitle },
  { href: '/dashboard/settings/billing', label: DASHBOARD_ROUTES.settingsBilling.pageTitle },
  { href: '/dashboard/settings/notifications', label: DASHBOARD_ROUTES.settingsNotifications.pageTitle },
  { href: '/dashboard/settings/integrations', label: 'Integrations' },
] as const;

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <DashboardPageHeader title={DASHBOARD_ROUTES.settings.pageTitle}>
        <nav className="flex gap-4 border-b border-border" aria-label="Settings sections">
          {tabs.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  '-mb-px border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </DashboardPageHeader>
      {children}
    </div>
  );
}
