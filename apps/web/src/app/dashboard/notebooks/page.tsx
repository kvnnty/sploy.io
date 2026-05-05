import type { Metadata } from 'next';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.notebooks;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const notebooks = [
  { title: 'Q2 Growth Deep Dive', owner: 'Growth team', lastRun: '2h ago' },
  { title: 'Pricing elasticity test', owner: 'RevOps', lastRun: '1d ago' },
  { title: 'Retention cohort audit', owner: 'Data', lastRun: '3d ago' },
];

export default function NotebooksPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} />

      <div className="grid gap-3 md:grid-cols-2">
        {notebooks.map((notebook) => (
          <article
            key={notebook.title}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-sm font-medium text-foreground">{notebook.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {notebook.owner} · Last run {notebook.lastRun}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
