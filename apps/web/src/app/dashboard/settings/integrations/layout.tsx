import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integrations · Settings',
};

export default function IntegrationsSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
