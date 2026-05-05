import type { Metadata } from 'next';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { BRAND_NAME } from '@/lib/dashboard-titles';
import { loadDashboardData } from '@/lib/dashboard-data';

export const metadata: Metadata = {
  title: {
    template: `%s · ${BRAND_NAME}`,
    default: `Dashboard · ${BRAND_NAME}`,
  },
};

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await loadDashboardData();

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute inset-0 opacity-[0.1] [background-image:radial-gradient(rgba(0,0,0,0.18)_1px,transparent_1px)] [background-size:20px_20px] dark:opacity-[0.08] dark:[background-image:radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)]" />
      </div>
      <DashboardLayout
        userEmail={data.user.email ?? ''}
        userName={data.user.name ?? data.user.email ?? 'User'}
        me={data.me}
        teams={data.teams}
        activeTeamId={data.activeTeamId}
        apiAvailable={data.apiAvailable}
      >
        {children}
      </DashboardLayout>
    </div>
  );
}
