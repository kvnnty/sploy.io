import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

import { SettingsShell } from './settings-shell';

export const metadata: Metadata = {
  title: DASHBOARD_ROUTES.settings.documentTitle,
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
