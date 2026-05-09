'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { useActiveTeamId } from '@/components/dashboard/active-team-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';
import type { AskDataSourceResponse } from '@/types/data-source.types';
import { useDataSourcesService } from '@/hooks/service-instances';
import { ApiError } from '@/lib/axios';

const t = DASHBOARD_ROUTES.ask;

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export function AskWorkspace() {
  const teamId = useActiveTeamId();
  const dataSourcesApi = useDataSourcesService();

  const sourcesQuery = useQuery({
    queryKey: queryKeys.dataSources.list(teamId ?? ''),
    queryFn: () => dataSourcesApi.list(teamId!),
    enabled: Boolean(teamId),
  });

  const [dataSourceId, setDataSourceId] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [schemaHint, setSchemaHint] = useState('');
  const [showSchemaHint, setShowSchemaHint] = useState(false);
  const [result, setResult] = useState<AskDataSourceResponse | null>(null);

  useEffect(() => {
    const list = sourcesQuery.data;
    if (!list?.length) {
      setDataSourceId('');
      return;
    }
    setDataSourceId((prev) =>
      prev && list.some((s) => s.id === prev) ? prev : list[0].id,
    );
  }, [sourcesQuery.data]);

  const askMutation = useMutation({
    mutationFn: async () => {
      if (!teamId || !dataSourceId) throw new Error('Missing team or connector');
      return dataSourcesApi.ask(teamId, dataSourceId, {
        question: question.trim(),
        schemaHint: schemaHint.trim() || undefined,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success('Query ran successfully');
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Request failed';
      toast.error(msg);
    },
  });

  const tableColumns = useMemo(() => {
    const rows = result?.rows ?? [];
    const first = rows[0];
    if (!first) return [] as string[];
    return Object.keys(first).slice(0, 12);
  }, [result?.rows]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} />

      {!teamId ? (
        <p className="text-sm text-muted-foreground">
          Select a team using the sidebar switcher to ask questions against your warehouse.
        </p>
      ) : sourcesQuery.isPending ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading connectors…
        </div>
      ) : sourcesQuery.isError ? (
        <p className="text-sm text-destructive">
          Could not load data connectors. Check that the API is running and try again.
        </p>
      ) : (sourcesQuery.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-border bg-muted/20 p-6 text-center text-sm">
          <p className="text-muted-foreground">
            Add a PostgreSQL connector first, then come back here to ask in plain language.
          </p>
          <Link
            href="/dashboard/data-connectors"
            className={cn(buttonVariants(), 'mt-4 inline-flex')}
          >
            Go to data connectors
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-5">
            <label className="block text-sm font-medium text-foreground">
              Connector
              <select
                className={cn(
                  'mt-1.5 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm',
                  'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none',
                )}
                value={dataSourceId}
                onChange={(e) => setDataSourceId(e.target.value)}
              >
                {(sourcesQuery.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.host}:{s.port}/{s.database}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-foreground">
              Question
              <textarea
                className={cn(
                  'mt-1.5 min-h-[100px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm',
                  'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none',
                )}
                placeholder='e.g. "What were total signups last week vs the week before?"'
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </label>

            <button
              type="button"
              onClick={() => setShowSchemaHint((v) => !v)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {showSchemaHint ? 'Hide schema hints' : 'Add schema hints (optional)'}
            </button>

            {showSchemaHint ? (
              <label className="block text-sm font-medium text-foreground">
                Table and column notes
                <textarea
                  className={cn(
                    'mt-1.5 min-h-[72px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground',
                    'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none',
                  )}
                  placeholder={
                    'e.g. "Table signups(uid, created_at); revenue in cents."'
                  }
                  value={schemaHint}
                  onChange={(e) => setSchemaHint(e.target.value)}
                />
              </label>
            ) : null}

            <Button
              type="button"
              disabled={askMutation.isPending || question.trim().length < 3}
              onClick={() => void askMutation.mutateAsync()}
            >
              {askMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Running…
                </>
              ) : (
                'Run analysis'
              )}
            </Button>
          </div>

          {result ? (
            <div className="space-y-6">
              {result.truncated ? (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Row cap reached; results may be truncated. Narrow your question or
                  aggregate in SQL later.
                </p>
              ) : null}

              {result.brief ? (
                <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Interpretation
                    </p>
                    <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      confidence: {result.brief.confidence}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {result.brief.answer}
                  </p>
                  {result.brief.drivers.length ? (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Likely drivers
                      </p>
                      <ol className="list-decimal space-y-2 ps-5 text-sm text-foreground">
                        {result.brief.drivers.map((d, i) => (
                          <li key={`${d.headline}-${i}`}>
                            <span className="font-medium">{d.headline}</span>
                            {d.detail ? (
                              <span className="text-muted-foreground">
                                {' '}
                                — {d.detail}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                  <div className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">
                      Suggested next step:{' '}
                    </span>
                    <span className="text-muted-foreground">
                      {result.brief.recommendedNextStep}
                    </span>
                  </div>
                  {result.brief.caveats.length ? (
                    <ul className="list-disc space-y-1 ps-5 text-xs text-muted-foreground">
                      {result.brief.caveats.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No AI interpretation returned (set OPENAI_API_KEY on the API for briefs).
                </p>
              )}

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  SQL executed
                </p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/40 p-3 text-xs">
                  {result.sql}
                </pre>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                {result.rows.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    Query returned no rows.
                  </p>
                ) : (
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        {tableColumns.map((col) => (
                          <th
                            key={col}
                            className="whitespace-nowrap px-3 py-2 font-semibold"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.slice(0, 100).map((row, ri) => (
                        <tr
                          key={ri}
                          className="border-b border-border odd:bg-muted/10 last:border-0"
                        >
                          {tableColumns.map((col) => (
                            <td
                              key={col}
                              className="max-w-[240px] truncate px-3 py-1.5 text-xs"
                              title={formatCell(row[col])}
                            >
                              {formatCell(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
