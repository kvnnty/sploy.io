'use client';

import type { ChartSpec } from '@/types/analysis.types';

export function AskChart({ spec }: { spec: ChartSpec }) {
  const maxY = Math.max(...spec.points.map((p) => p.y), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Chart · {spec.yKey} by {spec.xKey}
      </p>
      <div className="flex h-40 items-end gap-1 overflow-x-auto pb-1">
        {spec.points.map((p) => {
          const h = Math.max(4, Math.round((p.y / maxY) * 100));
          return (
            <div
              key={`${p.x}-${p.y}`}
              className="flex min-w-[28px] max-w-[48px] flex-1 flex-col items-center gap-1"
              title={`${p.x}: ${p.y}`}
            >
              <div
                className="w-full rounded-t bg-primary/70"
                style={{ height: `${h}%` }}
              />
              <span className="max-w-full truncate text-[9px] text-muted-foreground">
                {p.x.slice(0, 8)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
