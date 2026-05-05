import type { Metadata } from 'next';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.ask;

export const metadata: Metadata = {
  title: t.documentTitle,
};

export default function AskPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} />

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="space-y-3">
          <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-foreground">
            User: Explain the 14% WoW conversion drop for paid social.
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
            Agent: I ran channel and cohort breakdowns. Primary decline is from iOS web traffic
            where signup completion dropped after creative rotation.
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Query log: 3 SQL queries · 1 visualization · 1 notebook block saved.
          </div>
        </div>
      </div>
    </div>
  );
}
