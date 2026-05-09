import type { Metadata } from 'next';

import { AskWorkspace } from './ask-workspace';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.ask;

export const metadata: Metadata = {
  title: t.documentTitle,
};

export default function AskPage() {
  return <AskWorkspace />;
}
