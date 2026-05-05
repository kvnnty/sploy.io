import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

export const metadata: Metadata = {
  title: DASHBOARD_ROUTES.settingsSecurity.documentTitle,
};

export default function SecuritySettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
