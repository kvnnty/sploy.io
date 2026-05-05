import type { Metadata } from 'next';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.tasks;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const tasks = [
  { name: 'Weekly KPI digest', schedule: 'Every Monday 08:00', status: 'Active' },
  { name: 'CAC by channel watch', schedule: 'Daily 07:00', status: 'Active' },
  { name: 'Funnel anomaly monitor', schedule: 'Hourly', status: 'Draft' },
];

export default function TasksPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} />

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.name}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{task.name}</p>
              <p className="text-xs text-muted-foreground">{task.schedule}</p>
            </div>
            <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground">
              {task.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
