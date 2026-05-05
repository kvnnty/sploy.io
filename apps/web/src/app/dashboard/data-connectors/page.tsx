import type { Metadata } from 'next';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.dataConnectors;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const connectors = [
  { name: 'PostgreSQL warehouse', state: 'Connected', env: 'Production' },
  { name: 'Snowflake finance', state: 'Pending', env: 'Staging' },
  { name: 'BigQuery marketing', state: 'Connected', env: 'Production' },
];

export default function DataConnectorsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} />

      <div className="space-y-3">
        {connectors.map((connector) => (
          <div
            key={connector.name}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{connector.name}</p>
              <p className="text-xs text-muted-foreground">{connector.env}</p>
            </div>
            <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground">
              {connector.state}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
