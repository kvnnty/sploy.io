import type { Metadata } from 'next';

import { DataConnectorsWorkspace } from './data-connectors-workspace';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.dataConnectors;

export const metadata: Metadata = {
  title: t.documentTitle,
};

export default function DataConnectorsPage() {
  return <DataConnectorsWorkspace />;
}
