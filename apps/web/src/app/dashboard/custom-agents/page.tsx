import type { Metadata } from 'next';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.customAgents;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const agents = [
  { name: 'Growth Analyst', focus: 'Acquisition and activation', model: 'Sploy 1.1 Pro' },
  { name: 'Finance Analyst', focus: 'Revenue quality and cashflow', model: 'Sploy 1.1 Max' },
  { name: 'Lifecycle Analyst', focus: 'Retention and churn', model: 'Sploy 1.1 Lite' },
];

export default function CustomAgentsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} />

      <div className="grid gap-3 md:grid-cols-2">
        {agents.map((agent) => (
          <article key={agent.name} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">{agent.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{agent.focus}</p>
            <p className="mt-3 text-xs text-foreground/80">Model: {agent.model}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
