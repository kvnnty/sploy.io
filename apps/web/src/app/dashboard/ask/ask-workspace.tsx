'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AskChart } from '@/components/analysis/ask-chart';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { useActiveTeamId } from '@/components/dashboard/active-team-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';
import type { AskResponse, ChartSpec } from '@/types/analysis.types';
import {
  useAnalysisService,
  useDataSourcesService,
  useImportsService,
} from '@/hooks/service-instances';
import { ApiError } from '@/lib/axios';

const t = DASHBOARD_ROUTES.ask;

type SourceKind = 'connector' | 'import';

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
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const dataSourcesApi = useDataSourcesService();
  const importsApi = useImportsService();
  const analysisApi = useAnalysisService();

  const sourcesQuery = useQuery({
    queryKey: queryKeys.dataSources.list(teamId ?? ''),
    queryFn: () => dataSourcesApi.list(teamId!),
    enabled: Boolean(teamId),
  });

  const importsQuery = useQuery({
    queryKey: queryKeys.imports.list(teamId ?? ''),
    queryFn: () => importsApi.list(teamId!),
    enabled: Boolean(teamId),
  });

  const runsQuery = useQuery({
    queryKey: queryKeys.analysis.runs(teamId ?? ''),
    queryFn: () => analysisApi.listRuns(teamId!),
    enabled: Boolean(teamId),
  });

  const slackQuery = useQuery({
    queryKey: queryKeys.analysis.slack(teamId ?? ''),
    queryFn: () => analysisApi.getSlackStatus(teamId!),
    enabled: Boolean(teamId),
  });

  const [sourceKind, setSourceKind] = useState<SourceKind>('connector');
  const [dataSourceId, setDataSourceId] = useState('');
  const [importId, setImportId] = useState('');
  const [question, setQuestion] = useState('');
  const [schemaHint, setSchemaHint] = useState('');
  const [showSchemaHint, setShowSchemaHint] = useState(false);
  const [schemaLoaded, setSchemaLoaded] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const activeSourceId =
    sourceKind === 'connector' ? dataSourceId : importId;

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuestion(q);
    const runId = searchParams.get('run');
    if (runId && teamId) {
      void analysisApi.getRun(teamId, runId).then((run) => {
        setQuestion(run.question);
        setResult({
          sql: run.sql,
          rows: [],
          truncated: run.truncated,
          brief: run.brief ?? undefined,
          chartSpec: run.chartSpec,
          analysisRunId: run.id,
          schemaUsed: true,
        });
        if (run.dataSourceId) {
          setSourceKind('connector');
          setDataSourceId(run.dataSourceId);
        } else if (run.importId) {
          setSourceKind('import');
          setImportId(run.importId);
        }
      }).catch(() => toast.error('Could not load analysis run'));
    }
  }, [searchParams, teamId, analysisApi]);

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

  useEffect(() => {
    const list = importsQuery.data;
    if (!list?.length) {
      setImportId('');
      return;
    }
    setImportId((prev) =>
      prev && list.some((s) => s.id === prev) ? prev : list[0].id,
    );
  }, [importsQuery.data]);

  useEffect(() => {
    setSchemaLoaded(false);
  }, [dataSourceId, sourceKind]);

  const schemaQuery = useQuery({
    queryKey: queryKeys.dataSources.schema(teamId ?? '', dataSourceId),
    queryFn: () => dataSourcesApi.getSchema(teamId!, dataSourceId),
    enabled:
      Boolean(teamId && dataSourceId && sourceKind === 'connector'),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (schemaQuery.isSuccess && schemaQuery.data) {
      const lines = schemaQuery.data.tables.slice(0, 40).map((tbl) => {
        const cols = tbl.columns.map((c) => `${c.name} (${c.type})`).join(', ');
        return `Table ${tbl.name}: ${cols}`;
      });
      if (!schemaHint.trim()) {
        setSchemaHint(lines.join('\n').slice(0, 12_000));
      }
      setSchemaLoaded(true);
    }
  }, [schemaQuery.isSuccess, schemaQuery.data, schemaHint]);

  const hasAnySource =
    (sourcesQuery.data?.length ?? 0) > 0 ||
    (importsQuery.data?.length ?? 0) > 0;

  const askMutation = useMutation({
    mutationFn: async () => {
      if (!teamId || !activeSourceId) {
        throw new Error('Select a data source');
      }
      const body = {
        question: question.trim(),
        schemaHint: schemaHint.trim() || undefined,
      };
      if (sourceKind === 'connector') {
        return dataSourcesApi.ask(teamId, dataSourceId, body);
      }
      return importsApi.ask(teamId, importId, body);
    },
    onSuccess: (data) => {
      setResult(data);
      setActionId(null);
      setActionStatus(null);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.analysis.runs(teamId ?? ''),
      });
      toast.success('Analysis complete');
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

  const createActionMutation = useMutation({
    mutationFn: async () => {
      if (!teamId || !result?.analysisRunId) throw new Error('Run analysis first');
      return analysisApi.createAction(teamId, {
        analysisRunId: result.analysisRunId,
      });
    },
    onSuccess: (action) => {
      setActionId(action.id);
      setActionStatus(action.status);
      toast.success('Action saved as draft');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create action');
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!teamId || !actionId) throw new Error('Create an action first');
      return analysisApi.approveAction(teamId, actionId);
    },
    onSuccess: (action) => {
      setActionStatus(action.status);
      toast.success('Action approved');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'Approve failed');
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!teamId || !actionId) throw new Error('Create an action first');
      return analysisApi.sendAction(teamId, actionId);
    },
    onSuccess: (action) => {
      setActionStatus(action.status);
      toast.success('Sent to Slack');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'Send failed');
    },
  });

  const loadRun = useCallback(
    (runId: string) => {
      if (!teamId) return;
      void analysisApi.getRun(teamId, runId).then((run) => {
        setQuestion(run.question);
        setResult({
          sql: run.sql,
          rows: [],
          truncated: run.truncated,
          brief: run.brief ?? undefined,
          chartSpec: run.chartSpec,
          analysisRunId: run.id,
          schemaUsed: true,
        });
        setActionId(null);
        setActionStatus(null);
      });
    },
    [teamId, analysisApi],
  );

  const tableColumns = useMemo(() => {
    const rows = result?.rows ?? [];
    const first = rows[0];
    if (!first) return [] as string[];
    return Object.keys(first).slice(0, 12);
  }, [result?.rows]);

  const chartSpec = result?.chartSpec as ChartSpec | null | undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-6">
      <aside className="hidden w-56 shrink-0 lg:block">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recent
        </p>
        <ul className="space-y-1">
          {(runsQuery.data ?? []).slice(0, 12).map((run) => (
            <li key={run.id}>
              <button
                type="button"
                onClick={() => loadRun(run.id)}
                className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
              >
                <span className="line-clamp-2">{run.question}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <DashboardPageHeader title={t.pageTitle} description={t.description} />

        {!teamId ? (
          <p className="text-sm text-muted-foreground">
            Select a team using the sidebar switcher to ask questions against your data.
          </p>
        ) : sourcesQuery.isPending || importsQuery.isPending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading data sources…
          </div>
        ) : !hasAnySource ? (
          <div className="rounded-xl border border-border bg-muted/20 p-6 text-center text-sm">
            <p className="text-muted-foreground">
              Connect PostgreSQL or upload a CSV, then ask in plain language.
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSourceKind('connector')}
                  disabled={(sourcesQuery.data?.length ?? 0) === 0}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    sourceKind === 'connector'
                      ? 'border-primary/40 bg-primary/15 text-foreground'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  PostgreSQL
                </button>
                <button
                  type="button"
                  onClick={() => setSourceKind('import')}
                  disabled={(importsQuery.data?.length ?? 0) === 0}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    sourceKind === 'import'
                      ? 'border-primary/40 bg-primary/15 text-foreground'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  CSV import
                </button>
                {sourceKind === 'connector' && schemaLoaded ? (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] text-foreground">
                    Schema loaded
                  </span>
                ) : null}
              </div>

              {sourceKind === 'connector' ? (
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
              ) : (
                <label className="block text-sm font-medium text-foreground">
                  CSV import
                  <select
                    className={cn(
                      'mt-1.5 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm',
                      'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none',
                    )}
                    value={importId}
                    onChange={(e) => setImportId(e.target.value)}
                  >
                    {(importsQuery.data ?? []).map((imp) => (
                      <option key={imp.id} value={imp.id}>
                        {imp.name} · {imp.rowCount} rows
                      </option>
                    ))}
                  </select>
                </label>
              )}

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
                {showSchemaHint ? 'Hide schema hints' : 'Edit schema hints (optional)'}
              </button>

              {showSchemaHint ? (
                <label className="block text-sm font-medium text-foreground">
                  Table and column notes
                  <textarea
                    className={cn(
                      'mt-1.5 min-h-[72px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-xs',
                      'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none',
                    )}
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
                    Running analysis…
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
                    Row cap reached; results may be truncated.
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
                    {result.brief.sqlExplanation ? (
                      <p className="text-xs text-muted-foreground">
                        {result.brief.sqlExplanation}
                      </p>
                    ) : null}
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

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={createActionMutation.isPending || Boolean(actionId)}
                        onClick={() => void createActionMutation.mutateAsync()}
                      >
                        Save action
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          !actionId ||
                          actionStatus === 'approved' ||
                          actionStatus === 'sent' ||
                          approveMutation.isPending
                        }
                        onClick={() => void approveMutation.mutateAsync()}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          !actionId ||
                          actionStatus !== 'approved' ||
                          !slackQuery.data?.configured ||
                          sendMutation.isPending
                        }
                        onClick={() => void sendMutation.mutateAsync()}
                      >
                        {sendMutation.isPending ? 'Sending…' : 'Send to Slack'}
                      </Button>
                      {!slackQuery.data?.configured ? (
                        <Link
                          href="/dashboard/settings/integrations"
                          className="self-center text-xs text-primary hover:underline"
                        >
                          Configure Slack webhook
                        </Link>
                      ) : null}
                      {actionStatus === 'sent' ? (
                        <span className="self-center text-xs text-muted-foreground">
                          Delivered
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No AI interpretation (set OPENAI_API_KEY on the API).
                  </p>
                )}

                {chartSpec && chartSpec.points.length >= 2 ? (
                  <AskChart spec={chartSpec} />
                ) : null}

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    SQL executed
                  </p>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/40 p-3 text-xs">
                    {result.sql}
                  </pre>
                </div>

                {result.rows.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-border">
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
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
