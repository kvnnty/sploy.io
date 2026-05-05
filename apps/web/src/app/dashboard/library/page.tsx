import type { Metadata } from 'next';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.library;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const libraryItems = [
  'Revenue bridge template',
  'Paid social diagnostics',
  'Activation cohort framework',
  'Executive weekly report',
];

export default function LibraryPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} />

      <ul className="space-y-3">
        {libraryItems.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
