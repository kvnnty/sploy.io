import type { Metadata } from 'next';
import { ArrowPathIcon, ClockIcon, QueueListIcon } from '@/components/icons';
import { Icon } from '@/components/icons/icon';
import { IconBadge } from '@/components/icons/icon-badge';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';
import { cn } from '@/lib/utils';

const t = DASHBOARD_ROUTES.tasks;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const tasks = [
  {
    name: 'Weekly KPI digest',
    schedule: 'Every Monday 08:00',
    status: 'Active' as const,
    icon: QueueListIcon,
  },
  {
    name: 'CAC by channel watch',
    schedule: 'Daily 07:00',
    status: 'Active' as const,
    icon: ArrowPathIcon,
  },
  {
    name: 'Funnel anomaly monitor',
    schedule: 'Hourly',
    status: 'Draft' as const,
    icon: ClockIcon,
  },
];

export default function TasksPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} icon={QueueListIcon} />

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.name}
            className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition hover:border-primary/20"
          >
            <IconBadge icon={task.icon} variant={task.status === 'Active' ? 'primary' : 'default'} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{task.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Icon icon={ClockIcon} className="size-3" />
                {task.schedule}
              </p>
            </div>
            <span
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium',
                task.status === 'Active'
                  ? 'border-primary/30 bg-primary/15 text-foreground'
                  : 'border-border bg-muted/40 text-muted-foreground',
              )}
            >
              {task.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
