import type { Metadata } from 'next';
import { DocumentTextIcon, NotebookTabs } from '@/components/icons';
import { Icon } from '@/components/icons/icon';
import { IconBadge } from '@/components/icons/icon-badge';
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
      <DashboardPageHeader title={t.pageTitle} description={t.description} icon={NotebookTabs} />

      <div className="grid gap-3 md:grid-cols-2">
        {notebooks.map((notebook) => (
          <article
            key={notebook.title}
            className="group rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/25 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <IconBadge icon={DocumentTextIcon} variant="accent" size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground group-hover:text-foreground">
                  {notebook.title}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon icon={NotebookTabs} className="size-3" />
                  {notebook.owner} · Last run {notebook.lastRun}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
