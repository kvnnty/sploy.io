import type { Metadata } from 'next';
import { ArrowUp, ChevronDown, Sparkles, Wand2 } from 'lucide-react';

import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';

const t = DASHBOARD_ROUTES.new;

export const metadata: Metadata = {
  title: t.documentTitle,
};

const outputModes = ['Stock Analysis', 'Excel', 'Slides', 'Dashboard', 'Tracker', 'Report'];

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground">
          Sploy Analyst 1.1 Lite
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground">
          <Sparkles className="size-3.5" />
          Upgrade to full powers
        </button>
      </div>

      <section className="relative flex min-h-[65vh] flex-col items-center justify-center">
        <h1 className="text-center text-4xl font-semibold tracking-tight text-foreground">
          {t.heroHeading}
        </h1>
        <p className="mt-2 max-w-2xl text-center text-sm text-muted-foreground">{t.description}</p>

        <div className="mt-7 w-full max-w-3xl rounded-2xl border border-border bg-card p-4">
          <textarea
            placeholder="Analyze and visualize patterns in my data..."
            className="h-24 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground">
              Connectors
            </button>
            <button className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground">
              Tools
            </button>
            <button className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground">
              Agent
            </button>
            <button className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/15 px-2.5 py-1.5 text-xs text-foreground">
              <Wand2 className="size-3.5" />
              Advanced reasoning
            </button>
            <button className="ml-auto inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90">
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {outputModes.map((mode) => (
            <button
              key={mode}
              className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground"
            >
              {mode}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
