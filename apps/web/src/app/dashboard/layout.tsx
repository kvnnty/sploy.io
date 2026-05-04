import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { loadDashboardData } from '@/lib/dashboard-data';

export default async function DashboardLayout({
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
      <DashboardShell
        userEmail={data.user.email ?? ''}
        me={data.me}
        orgs={data.orgs}
        activeOrgId={data.activeOrgId}
        apiAvailable={data.apiAvailable}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
