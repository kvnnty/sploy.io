import type { Metadata } from 'next';

import { DashboardHome } from './dashboard-home';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.new;

export const metadata: Metadata = {
  title: t.documentTitle,
};

export default function DashboardPage() {
  return <DashboardHome />;
}
