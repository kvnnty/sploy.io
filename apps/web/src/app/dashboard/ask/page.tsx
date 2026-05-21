import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AskWorkspace } from './ask-workspace';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.ask;

export const metadata: Metadata = {
  title: t.documentTitle,
};

export default function AskPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading…</p>}>
      <AskWorkspace />
    </Suspense>
  );
}
