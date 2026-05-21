import type { Metadata } from 'next';
import {
  ChartBarSquareIcon,
  FolderOpenIcon,
  LightBulbIcon,
  PresentationChartLineIcon,
  RectangleStackIcon,
} from '@/components/icons';
import { IconBadge } from '@/components/icons/icon-badge';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';
import type { IconComponent } from '@/components/icons/types';

const t = DASHBOARD_ROUTES.library;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const libraryItems: { title: string; icon: IconComponent }[] = [
  { title: 'Revenue bridge template', icon: ChartBarSquareIcon },
  { title: 'Paid social diagnostics', icon: PresentationChartLineIcon },
  { title: 'Activation cohort framework', icon: LightBulbIcon },
  { title: 'Executive weekly report', icon: FolderOpenIcon },
];

export default function LibraryPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <DashboardPageHeader
        title={t.pageTitle}
        description={t.description}
        icon={RectangleStackIcon}
      />

      <ul className="space-y-3">
        {libraryItems.map((item) => (
          <li
            key={item.title}
            className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm transition hover:border-primary/20"
          >
            <IconBadge icon={item.icon} variant="default" size="sm" />
            <span className="font-medium">{item.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
