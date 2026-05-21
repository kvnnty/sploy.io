import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUp,
  ChevronDown,
  CircleStackIcon,
  CpuChipIcon,
  PresentationChartLineIcon,
  Sparkles,
  SparklesSolidIcon,
  TableCellsIcon,
  Wand2,
  WrenchScrewdriverIcon,
} from '@/components/icons';
import { Icon } from '@/components/icons/icon';
import { AnalyticsHeroIllustration } from '@/components/illustrations';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.new;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const outputModes = [
  { label: 'Stock Analysis', icon: PresentationChartLineIcon },
  { label: 'Excel', icon: TableCellsIcon },
  { label: 'Slides', icon: PresentationChartLineIcon },
  { label: 'Dashboard', icon: CircleStackIcon },
  { label: 'Tracker', icon: CpuChipIcon },
  { label: 'Report', icon: TableCellsIcon },
] as const;

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm"
        >
          <Icon icon={CpuChipIcon} className="size-4 text-primary" />
          Sploy Analyst 1.1 Lite
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-foreground"
        >
          <SparklesSolidIcon className="size-3.5 text-foreground" />
          Upgrade to full powers
        </button>
      </div>

      <section className="relative flex min-h-[65vh] flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/30 px-4 py-10">
        <div
          className="pointer-events-none absolute -right-8 top-8 hidden opacity-60 lg:block"
          aria-hidden
        >
          <AnalyticsHeroIllustration />
        </div>
        <div
          className="pointer-events-none absolute -left-12 bottom-4 hidden opacity-40 xl:block"
          aria-hidden
        >
          <div className="size-32 rounded-full bg-primary/20 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/20 ring-1 ring-primary/30">
            <Sparkles className="size-6 text-foreground" />
          </div>
          <h1 className="text-center text-4xl font-semibold tracking-tight text-foreground">
            {t.heroHeading}
          </h1>
          <p className="mt-2 max-w-2xl text-center text-sm text-muted-foreground">{t.description}</p>

          <div className="mt-7 w-full max-w-3xl rounded-2xl border border-border bg-card p-4 shadow-sm">
            <textarea
              placeholder="Analyze and visualize patterns in my data..."
              className="h-24 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground"
              >
                <Icon icon={CircleStackIcon} className="size-3.5" />
                Connectors
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground"
              >
                <Icon icon={WrenchScrewdriverIcon} className="size-3.5" />
                Tools
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground"
              >
                <Icon icon={CpuChipIcon} className="size-3.5" />
                Agent
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/15 px-2.5 py-1.5 text-xs text-foreground"
              >
                <Wand2 className="size-3.5" />
                Advanced reasoning
              </button>
              <button
                type="button"
                className="ml-auto inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:opacity-90"
                aria-label="Submit analysis"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {outputModes.map(({ label, icon: ModeIcon }) => (
              <button
                key={label}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground transition hover:border-primary/30 hover:bg-primary/10"
              >
                <Icon icon={ModeIcon} className="size-3.5 opacity-70" />
                {label}
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/dashboard/data-connectors" className="underline-offset-4 hover:underline">
              Connect data
            </Link>
            {' · '}
            <Link href="/dashboard/library" className="underline-offset-4 hover:underline">
              Browse templates
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
