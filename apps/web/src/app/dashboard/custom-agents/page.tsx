import type { Metadata } from 'next';
import { BoltIcon, CpuChipIcon, Sparkles, UserGroupIcon } from '@/components/icons';
import { Icon } from '@/components/icons/icon';
import { IconBadge } from '@/components/icons/icon-badge';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';
import type { IconComponent } from '@/components/icons/types';

const t = DASHBOARD_ROUTES.customAgents;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const agents: {
  name: string;
  focus: string;
  model: string;
  icon: IconComponent;
}[] = [
  { name: 'Growth Analyst', focus: 'Acquisition and activation', model: 'Sploy 1.1 Pro', icon: BoltIcon },
  { name: 'Finance Analyst', focus: 'Revenue quality and cashflow', model: 'Sploy 1.1 Max', icon: UserGroupIcon },
  { name: 'Lifecycle Analyst', focus: 'Retention and churn', model: 'Sploy 1.1 Lite', icon: CpuChipIcon },
];

export default function CustomAgentsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} icon={Sparkles} />

      <div className="grid gap-3 md:grid-cols-2">
        {agents.map((agent) => (
          <article
            key={agent.name}
            className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/25"
          >
            <div className="flex items-start gap-3">
              <IconBadge icon={agent.icon} variant="primary" size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{agent.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{agent.focus}</p>
                <p className="mt-3 inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs text-foreground/80">
                  <Icon icon={CpuChipIcon} className="size-3" />
                  Model: {agent.model}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
