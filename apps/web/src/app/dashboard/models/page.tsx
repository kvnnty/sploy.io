import type { Metadata } from 'next';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.models;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const models = [
  {
    name: 'Sploy 1.1 Max',
    description: 'Most capable agent for complex analysis',
    selected: false,
  },
  {
    name: 'Sploy 1.1 Pro',
    description: 'Balanced quality for most analyst tasks',
    selected: true,
  },
  {
    name: 'Sploy 1.1 Lite',
    description: 'Fast answers for quick questions',
    selected: false,
  },
];

export default function ModelsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} />

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="space-y-2">
          {models.map((model) => (
            <button
              key={model.name}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-left"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{model.name}</p>
                <p className="text-xs text-muted-foreground">{model.description}</p>
              </div>
              <span
                className={
                  model.selected ? 'text-xs text-primary' : 'text-xs text-muted-foreground'
                }
              >
                {model.selected ? 'Selected' : 'Select'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
