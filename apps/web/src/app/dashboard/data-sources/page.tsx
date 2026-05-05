import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Data sources',
};

export default function DataSourcesPage() {
  redirect('/dashboard/data-connectors');
}
