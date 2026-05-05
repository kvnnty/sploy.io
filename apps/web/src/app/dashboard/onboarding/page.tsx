import type { Metadata } from 'next';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.onboarding;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const checklist = [
  { label: 'Connect your first data source', description: 'Attach warehouse or BI export credentials.' },
  { label: 'Run baseline KPI analysis', description: 'Verify query access and schema mapping.' },
  { label: 'Create your first custom agent', description: 'Save role prompts for your team workflows.' },
  { label: 'Publish a weekly notebook task', description: 'Automate insight delivery to stakeholders.' },
];

export default function OnboardingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} />

      <div className="space-y-3">
        {checklist.map((item, index) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card px-4 py-3"
          >
            <p className="text-sm font-medium text-foreground">
              {index + 1}. {item.label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
