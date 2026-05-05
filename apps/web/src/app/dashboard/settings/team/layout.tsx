import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

export const metadata: Metadata = {
  title: DASHBOARD_ROUTES.settingsTeam.documentTitle,
};

export default function TeamSettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
