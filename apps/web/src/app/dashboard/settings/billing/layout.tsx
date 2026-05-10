import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

export const metadata: Metadata = {
  title: DASHBOARD_ROUTES.settingsBilling.documentTitle,
};

export default function BillingSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
