'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  History,
  Loader2,
  PlugZap,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';

import { useActiveTeamId } from '@/components/dashboard/active-team-provider';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  useAuthService,
  useDataSourcesService,
  useImportsService,
} from '@/hooks/service-instances';
import { useConnectorDemos } from '@/hooks/use-connector-demos';
import { ApiError } from '@/lib/axios';
import {
  CONNECTOR_CATALOG,
  CONNECTOR_CATEGORY_LABELS,
  type ConnectorCategoryId,
  type ConnectorDefinition,
  type ConnectorSyncStatus,
} from '@/lib/connectors/catalog';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import type { CreateDataSourceBody, DataSourceSummary } from '@/types/data-source.types';

const t = DASHBOARD_ROUTES.dataConnectors;

const emptyForm: CreateDataSourceBody = {
  name: '',
  host: '',
  port: 5432,
  database: '',
  username: '',
  password: '',
};

const CATEGORY_TABS: { id: ConnectorCategoryId; label: string }[] = [
  { id: 'recommended', label: 'Recommended' },
  ...(Object.entries(CONNECTOR_CATEGORY_LABELS) as [
    Exclude<ConnectorCategoryId, 'recommended'>,
    string,
  ][]).map(([id, label]) => ({ id, label })),
];

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function recommendedConnectorIds(connected: Set<string>): string[] {
  const rec: string[] = [];
  for (const def of CONNECTOR_CATALOG) {
    if (!connected.has(def.id)) continue;
    for (const s of def.suggests ?? []) {
      if (!connected.has(s) && !rec.includes(s)) rec.push(s);
    }
  }
  if (rec.length === 0) {
    return ['postgresql', 'slack', 'stripe', 'bigquery'].filter((id) => !connected.has(id));
  }
  return rec;
}

function ConnectorLogo({ domain, name }: { domain: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/40 text-xs font-semibold tracking-tight text-muted-foreground"
        aria-hidden
      >
        {name
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 3)}
      </div>
    );
  }
  return (
    <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-white/4">
      <Image
        src={`https://logo.clearbit.com/${domain}`}
        alt=""
        width={44}
        height={44}
        className="size-11 object-contain p-1.5"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ConnectorSyncStatus }) {
  const cfg: Record<
    ConnectorSyncStatus,
    { label: string; className: string; pulse?: boolean }
  > = {
    disconnected: {
      label: 'Not connected',
      className:
        'border-border/80 bg-muted/30 text-muted-foreground',
    },
    syncing: {
      label: 'Syncing',
      className: 'border-primary/35 bg-primary/10 text-foreground',
      pulse: true,
    },
    live: {
      label: 'Live',
      className:
        'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      pulse: true,
    },
    delayed: {
      label: 'Delayed',
      className: 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200',
    },
    error: {
      label: 'Error',
      className: 'border-destructive/40 bg-destructive/10 text-destructive',
    },
    needs_reauth: {
      label: 'Needs reauthentication',
      className: 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-200',
    },
    agent_indexed: {
      label: 'Agent indexed',
      className: 'border-sky-500/35 bg-sky-500/10 text-sky-800 dark:text-sky-200',
    },
  };
  const c = cfg[status];
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', c.className)}>
      {c.pulse ? (
        <span
          className={cn(
            'size-1.5 rounded-full bg-current',
            status === 'syncing' && 'animate-pulse',
            status === 'live' && 'animate-pulse',
          )}
          aria-hidden
        />
      ) : null}
      {c.label}
    </Badge>
  );
}

type ActivityItem = { id: string; at: string; message: string; kind: 'info' | 'warn' | 'success' };

export function DataConnectorsWorkspace() {
  const teamId = useActiveTeamId();
  const reduceMotion = useReducedMotion();
  const auth = useAuthService();
  const dataSourcesApi = useDataSourcesService();
  const qc = useQueryClient();
  const { demos, hydrated, updateDemo, removeDemo } = useConnectorDemos(teamId);

  const teamsQuery = useQuery({
    queryKey: queryKeys.auth.teams(),
    queryFn: () => auth.getTeams(),
    enabled: Boolean(teamId),
  });

  const sourcesQuery = useQuery({
    queryKey: queryKeys.dataSources.list(teamId ?? ''),
    queryFn: () => dataSourcesApi.list(teamId!),
    enabled: Boolean(teamId),
  });

  const importsApi = useImportsService();
  const importsQuery = useQuery({
    queryKey: queryKeys.imports.list(teamId ?? ''),
    queryFn: () => importsApi.list(teamId!),
    enabled: Boolean(teamId),
  });

  const uploadCsvMutation = useMutation({
    mutationFn: (file: File) => importsApi.upload(teamId!, file, file.name),
    onSuccess: () => {
      toast.success('CSV imported — ask questions in Ask');
      void qc.invalidateQueries({ queryKey: queryKeys.imports.list(teamId!) });
      pushActivity('CSV dataset uploaded', 'success');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'CSV upload failed');
    },
  });

  const [category, setCategory] = useState<ConnectorCategoryId>('recommended');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityReady, setActivityReady] = useState(false);
  const [postgresOpen, setPostgresOpen] = useState(false);
  const [demoTarget, setDemoTarget] = useState<ConnectorDefinition | null>(null);
  const [form, setForm] = useState<CreateDataSourceBody>(emptyForm);

  const teamName =
    teamsQuery.data?.find((x) => x.team_id === teamId)?.name ?? 'Workspace';

  const membershipRole =
    teamsQuery.data?.find((t) => t.team_id === teamId)?.role ?? '';
  const canManage = membershipRole === 'owner' || membershipRole === 'admin';

  const pushActivity = useCallback((message: string, kind: ActivityItem['kind'] = 'info') => {
    setActivity((a) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        at: new Date().toISOString(),
        message,
        kind,
      },
      ...a,
    ].slice(0, 24));
  }, []);

  const connectedIds = useMemo(() => {
    const s = new Set<string>();
    const rows = sourcesQuery.data ?? [];
    if (rows.length > 0) s.add('postgresql');
    for (const [id, d] of Object.entries(demos)) {
      if (d.status !== 'disconnected') s.add(id);
    }
    return s;
  }, [sourcesQuery.data, demos]);

  const recommendedIds = useMemo(
    () => recommendedConnectorIds(connectedIds),
    [connectedIds],
  );

  const recExplanation = useMemo(() => {
    if ((sourcesQuery.data ?? []).length > 0) {
      return 'Based on your live warehouse, Sploy suggests complementary sources to complete revenue and engagement context.';
    }
    if (Object.keys(demos).length > 0) {
      return 'Based on your preview connections, here is the next layer of enterprise sources teams usually add.';
    }
    return 'Start with a database or finance source to unlock contextual recommendations.';
  }, [sourcesQuery.data, demos]);

  useEffect(() => {
    setActivityReady(false);
    if (!teamId) {
      setActivity([]);
      setActivityReady(true);
      return;
    }
    try {
      const raw = sessionStorage.getItem(`sploy.connector-activity:${teamId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as ActivityItem[];
        if (Array.isArray(parsed)) setActivity(parsed.slice(0, 24));
        else setActivity([]);
      } else setActivity([]);
    } catch {
      setActivity([]);
    }
    setActivityReady(true);
  }, [teamId]);

  useEffect(() => {
    if (!activityReady || !teamId || typeof window === 'undefined') return;
    sessionStorage.setItem(`sploy.connector-activity:${teamId}`, JSON.stringify(activity));
  }, [activity, activityReady, teamId]);

  const createMutation = useMutation({
    mutationFn: () =>
      dataSourcesApi.create(teamId!, {
        ...form,
        name: form.name.trim(),
        host: form.host.trim(),
        database: form.database.trim(),
        username: form.username.trim(),
        password: form.password,
      }),
    onSuccess: () => {
      toast.success('PostgreSQL connector live');
      setForm(emptyForm);
      setPostgresOpen(false);
      void qc.invalidateQueries({ queryKey: queryKeys.dataSources.list(teamId!) });
      pushActivity(`PostgreSQL “${form.name.trim() || 'connection'}” added to ${teamName}`, 'success');
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Could not add connector';
      toast.error(msg);
    },
  });

  const testMutation = useMutation({
    mutationFn: (dataSourceId: string) =>
      dataSourcesApi.testConnection(teamId!, dataSourceId),
    onSuccess: () => {
      toast.success('Connection OK');
      pushActivity('PostgreSQL connection test succeeded', 'success');
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Connection test failed';
      toast.error(msg);
      pushActivity(`Connection test failed: ${msg}`, 'warn');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (dataSourceId: string) =>
      dataSourcesApi.remove(teamId!, dataSourceId),
    onSuccess: () => {
      toast.success('Connector removed');
      void qc.invalidateQueries({ queryKey: queryKeys.dataSources.list(teamId!) });
      pushActivity('PostgreSQL connector removed', 'info');
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Could not remove connector';
      toast.error(msg);
    },
  });

  function updateField<K extends keyof CreateDataSourceBody>(
    key: K,
    value: CreateDataSourceBody[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const creating =
    !form.name.trim() ||
    !form.host.trim() ||
    !form.database.trim() ||
    !form.username.trim() ||
    !form.password;

  function resolveCardStatus(
    def: ConnectorDefinition,
    pgSources: DataSourceSummary[],
  ): { status: ConnectorSyncStatus; lastSyncAt: string | null; count?: number } {
    if (def.implementation === 'postgresql') {
      if (pgSources.length === 0) {
        return { status: 'disconnected', lastSyncAt: null };
      }
      const latest = pgSources.reduce((a, b) =>
        new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b,
      );
      return {
        status: 'live',
        lastSyncAt: latest.updatedAt,
        count: pgSources.length,
      };
    }
    const d = demos[def.id];
    if (!d) return { status: 'disconnected', lastSyncAt: null };
    return { status: d.status, lastSyncAt: d.lastSyncAt };
  }

  function startDemoSync(def: ConnectorDefinition) {
    setDemoTarget(null);
    updateDemo(def.id, { status: 'syncing', lastSyncAt: null });
    pushActivity(`Preview sync started · ${def.name}`, 'info');
    window.setTimeout(() => {
      updateDemo(def.id, {
        status: 'agent_indexed',
        lastSyncAt: new Date().toISOString(),
      });
      pushActivity(`${def.name} indexed for agents (preview)`, 'success');
      window.setTimeout(() => {
        updateDemo(def.id, {
          status: 'live',
          lastSyncAt: new Date().toISOString(),
        });
      }, 900);
    }, 2200);
  }

  const pgSources = useMemo(
    () =>
      (sourcesQuery.data ?? []).filter((r) => r.kind.toLowerCase() === 'postgresql'),
    [sourcesQuery.data],
  );

  const searchQ = search.trim().toLowerCase();
  const filteredCatalog = useMemo(() => {
    return CONNECTOR_CATALOG.filter((def) => {
      if (!searchQ) return true;
      const cat = CONNECTOR_CATEGORY_LABELS[def.category].toLowerCase();
      return (
        def.name.toLowerCase().includes(searchQ) ||
        def.description.toLowerCase().includes(searchQ) ||
        cat.includes(searchQ)
      );
    });
  }, [searchQ]);

  const visibleCards = useMemo(() => {
    if (category === 'recommended') {
      const ids = new Set(recommendedIds);
      const list = filteredCatalog.filter((c) => ids.has(c.id));
      return list.length > 0 ? list : filteredCatalog.slice(0, 6);
    }
    return filteredCatalog.filter((c) => c.category === category);
  }, [category, filteredCatalog, recommendedIds]);

  const failureCount = useMemo(() => {
    let n = 0;
    for (const d of Object.values(demos)) {
      if (d.status === 'error') n += 1;
    }
    return n;
  }, [demos]);

  const showAiBanner = recommendedIds.length > 0 && category === 'recommended';

  if (!teamId) {
    return (
      <p className="text-sm text-muted-foreground">Select a team to manage connectors.</p>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[1580px] space-y-8 pb-16">
      <div
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/7 blur-3xl dark:bg-primary/12"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-500/6 blur-3xl"
        aria-hidden
      />

      <header className="relative space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Integrations
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Connectors
            </h1>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              {t.description}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
            <Link
              href="/dashboard/ask"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'justify-center')}
            >
              Open Ask
            </Link>
            {canManage ? (
              <Button
                type="button"
                size="sm"
                className="gap-2 shadow-sm"
                onClick={() => setPostgresOpen(true)}
              >
                <Plus className="size-4" aria-hidden />
                Add connector
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search connectors by name, capability, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'h-11 w-full rounded-xl border border-border/80 bg-card/60 pl-10 pr-4 text-sm',
                'outline-none backdrop-blur-sm placeholder:text-muted-foreground/80',
                'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground md:max-w-[200px]">
            Workspace · <span className="text-foreground/90">{teamName}</span>
          </p>
        </div>

        {showAiBanner ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-r from-card/90 via-card/70 to-primary/8 p-4 shadow-sm',
              'dark:from-card dark:via-card/95 dark:to-primary/12',
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                  <Sparkles className="size-5 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Suggested next sources</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {recExplanation}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-primary/25"
                onClick={() => setCategory('recommended')}
              >
                View recommendations
              </Button>
            </div>
          </motion.div>
        ) : null}

        {failureCount > 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/35 bg-destructive/5 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="font-medium text-destructive">Some preview syncs need attention</p>
              <p className="mt-1 text-muted-foreground">
                {failureCount} connector{failureCount > 1 ? 's' : ''} reported errors. Open the card
                to retry or disconnect.
              </p>
            </div>
          </div>
        ) : null}
      </header>

      <div className="relative flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-6">
          {canManage ? (
            <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Upload CSV</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Export from Excel or Sheets as CSV — up to 10k rows. Then ask in{' '}
                    <Link href="/dashboard/ask" className="text-primary hover:underline">
                      Ask
                    </Link>
                    .
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    disabled={uploadCsvMutation.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadCsvMutation.mutateAsync(file);
                      e.target.value = '';
                    }}
                  />
                  <span className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium">
                    {uploadCsvMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1 size-4 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      'Choose CSV'
                    )}
                  </span>
                </label>
              </div>
              {(importsQuery.data?.length ?? 0) > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  {importsQuery.data!.map((imp) => (
                    <li key={imp.id}>
                      {imp.name} · {imp.rowCount.toLocaleString()} rows
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-1 rounded-2xl border border-border/60 bg-muted/25 p-1">
              {CATEGORY_TABS.map((tab) => {
                const active = category === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategory(tab.id)}
                    className={cn(
                      'whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition-colors',
                      active
                        ? 'bg-card text-foreground shadow-sm ring-1 ring-border/80'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {!canManage ? (
            <p className="text-xs text-muted-foreground">
              Only owners and admins can add or remove connectors. You can still review status.
            </p>
          ) : null}

          {sourcesQuery.isPending || !hydrated ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/10 py-20">
              <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">Loading connector graph…</p>
            </div>
          ) : sourcesQuery.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="text-sm font-medium text-destructive">Could not load connectors</p>
              <p className="mt-2 text-xs text-muted-foreground">Check that the API is running and try again.</p>
            </div>
          ) : visibleCards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 px-6 py-16 text-center">
              <Search className="mx-auto size-10 text-muted-foreground/60" aria-hidden />
              <p className="mt-4 text-sm font-medium text-foreground">No connectors match</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Try another keyword or clear search to see the full catalog.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-6"
                onClick={() => setSearch('')}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {pgSources.length === 0 &&
              Object.keys(demos).length === 0 &&
              searchQ === '' ? (
                <div className="rounded-2xl border border-border/70 bg-card/40 p-8 text-center backdrop-blur-sm">
                  <PlugZap className="mx-auto size-10 text-muted-foreground" aria-hidden />
                  <p className="mt-4 text-sm font-medium text-foreground">No live connections yet</p>
                  <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                    Add PostgreSQL for production analytics, or start a preview sync on an enterprise
                    source to see health, permissions, and agent indexing in action.
                  </p>
                  {canManage ? (
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      <Button type="button" size="sm" onClick={() => setPostgresOpen(true)}>
                        Connect PostgreSQL
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const slack = CONNECTOR_CATALOG.find((c) => c.id === 'slack');
                          if (slack) setDemoTarget(slack);
                        }}
                      >
                        Preview Slack sync
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                {visibleCards.map((def) => {
                  const { status, lastSyncAt, count } = resolveCardStatus(def, pgSources);
                  return (
                    <ConnectorCard
                      key={def.id}
                      def={def}
                      status={status}
                      lastSyncAt={lastSyncAt}
                      count={count}
                      expanded={expandedId === def.id}
                      onToggleExpand={() =>
                        setExpandedId((id) => (id === def.id ? null : def.id))
                      }
                      canManage={canManage}
                      reduceMotion={!!reduceMotion}
                      onConnect={() =>
                        def.implementation === 'postgresql'
                          ? setPostgresOpen(true)
                          : setDemoTarget(def)
                      }
                      onManage={() =>
                        def.implementation === 'postgresql'
                          ? setExpandedId(def.id)
                          : setDemoTarget(def)
                      }
                      onDisconnectDemo={() => {
                        removeDemo(def.id);
                        pushActivity(`Disconnected preview · ${def.name}`, 'info');
                      }}
                      onTestPostgres={(id) => void testMutation.mutateAsync(id)}
                      testing={testMutation.isPending}
                      onRemovePostgres={(id) => {
                        if (window.confirm('Remove this PostgreSQL connector?')) {
                          void deleteMutation.mutateAsync(id);
                        }
                      }}
                      removing={deleteMutation.isPending}
                      pgSources={pgSources}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="w-full shrink-0 space-y-4 xl:sticky xl:top-24 xl:w-[300px]">
          <div className="rounded-2xl border border-border/70 bg-card/50 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Activity className="size-4 text-muted-foreground" aria-hidden />
              Recent activity
            </div>
            <ul className="mt-4 max-h-[240px] space-y-3 overflow-y-auto pr-1 text-xs">
              {activity.length === 0 ? (
                <li className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-6 text-center text-muted-foreground">
                  Activity from tests, syncs, and connector changes appears here.
                </li>
              ) : (
                activity.map((a) => (
                  <li
                    key={a.id}
                    className="border-b border-border/40 pb-3 last:border-0 last:pb-0"
                  >
                    <p
                      className={cn(
                        'leading-snug text-foreground/90',
                        a.kind === 'warn' && 'text-amber-700 dark:text-amber-200',
                        a.kind === 'success' && 'text-emerald-700 dark:text-emerald-300',
                      )}
                    >
                      {a.message}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {formatRelativeTime(a.at)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/50 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <History className="size-4 text-muted-foreground" aria-hidden />
              Audit & history
            </div>
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <Shield className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
                <span>
                  Credentials encrypted at rest; analysts never see raw database passwords in the UI.
                </span>
              </li>
              <li className="flex gap-2">
                <BookOpen className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
                <span>Exports of connector activity require owner approval in enterprise workspaces.</span>
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500/90" aria-hidden />
                <span className="text-foreground/80">
                  Multi-workspace: switching teams loads an isolated connector graph and permissions
                  map.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground/90">Agent access</p>
            <p className="mt-2">
              Connectors inherit workspace roles. Agents can only query sources you connect and
              actions your policy allows—SQL is read-only on PostgreSQL today.
            </p>
          </div>
        </aside>
      </div>

      <Sheet open={postgresOpen} onOpenChange={setPostgresOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader className="space-y-1 border-b border-border/60 pb-4">
            <SheetTitle>Connect PostgreSQL</SheetTitle>
            <p className="text-xs text-muted-foreground">
              Production path: read-only analyst access with encrypted credentials.
            </p>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-foreground sm:col-span-2">
                Name
                <input
                  className={cn(
                    'mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm',
                    'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                  )}
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Production warehouse"
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                Host
                <input
                  className={cn(
                    'mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm',
                    'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                  )}
                  value={form.host}
                  onChange={(e) => updateField('host', e.target.value)}
                  placeholder="db.example.com"
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                Port
                <input
                  type="number"
                  className={cn(
                    'mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm',
                    'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                  )}
                  value={form.port}
                  onChange={(e) =>
                    updateField('port', Number.parseInt(e.target.value, 10) || 5432)
                  }
                />
              </label>
              <label className="text-sm font-medium text-foreground sm:col-span-2">
                Database
                <input
                  className={cn(
                    'mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm',
                    'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                  )}
                  value={form.database}
                  onChange={(e) => updateField('database', e.target.value)}
                />
              </label>
              <label className="text-sm font-medium text-foreground sm:col-span-2">
                Username
                <input
                  className={cn(
                    'mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm',
                    'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                  )}
                  autoComplete="off"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                />
              </label>
              <label className="text-sm font-medium text-foreground sm:col-span-2">
                Password
                <input
                  type="password"
                  className={cn(
                    'mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm',
                    'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                  )}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                />
              </label>
            </div>
          </div>
          <SheetFooter className="border-t border-border/60 pt-4">
            <Button
              type="button"
              disabled={createMutation.isPending || creating}
              onClick={() => void createMutation.mutateAsync()}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                'Save connector'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full sm:mt-0 sm:w-auto"
              onClick={() => setPostgresOpen(false)}
            >
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(demoTarget)} onOpenChange={(o) => !o && setDemoTarget(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
          {demoTarget ? (
            <>
              <SheetHeader className="space-y-2 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <ConnectorLogo domain={demoTarget.logoDomain} name={demoTarget.name} />
                  <div>
                    <SheetTitle>{demoTarget.name}</SheetTitle>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {CONNECTOR_CATEGORY_LABELS[demoTarget.category]}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {demoTarget.description}
                </p>
              </SheetHeader>
              <div className="flex-1 space-y-4 overflow-y-auto py-4 text-sm">
                <div className="rounded-xl border border-border/60 bg-muted/15 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground/90">Preview sync</p>
                  <p className="mt-2 leading-relaxed">
                    Full OAuth and enterprise provisioning ships next. This preview simulates sync,
                    health badges, and agent indexing so you can validate the operating experience.
                  </p>
                </div>
                {demos[demoTarget.id]?.status === 'live' ||
                demos[demoTarget.id]?.status === 'agent_indexed' ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-foreground">Manage preview</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-center text-destructive hover:text-destructive"
                      onClick={() => {
                        removeDemo(demoTarget.id);
                        pushActivity(`Disconnected preview · ${demoTarget.name}`, 'info');
                        setDemoTarget(null);
                      }}
                    >
                      Disconnect preview
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => {
                        updateDemo(demoTarget.id, {
                          status: 'error',
                          lastSyncAt: new Date().toISOString(),
                        });
                        pushActivity(`Injected error state for ${demoTarget.name} (demo)`, 'warn');
                      }}
                    >
                      Simulate sync error
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => {
                        updateDemo(demoTarget.id, {
                          status: 'needs_reauth',
                          lastSyncAt: demos[demoTarget.id]?.lastSyncAt ?? null,
                        });
                        pushActivity(`${demoTarget.name} requires reauthentication (demo)`, 'warn');
                      }}
                    >
                      Simulate needs reauthentication
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => startDemoSync(demoTarget)}
                  >
                    Start preview sync
                  </Button>
                )}
              </div>
              <SheetFooter className="border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setDemoTarget(null)}
                >
                  Close
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

type ConnectorCardProps = {
  def: ConnectorDefinition;
  status: ConnectorSyncStatus;
  lastSyncAt: string | null;
  count?: number;
  expanded: boolean;
  onToggleExpand: () => void;
  canManage: boolean;
  reduceMotion: boolean;
  onConnect: () => void;
  onManage: () => void;
  onDisconnectDemo: () => void;
  onTestPostgres: (id: string) => void;
  testing: boolean;
  onRemovePostgres: (id: string) => void;
  removing: boolean;
  pgSources: DataSourceSummary[];
};

function ConnectorCard({
  def,
  status,
  lastSyncAt,
  count,
  expanded,
  onToggleExpand,
  canManage,
  reduceMotion,
  onConnect,
  onManage,
  onDisconnectDemo,
  onTestPostgres,
  testing,
  onRemovePostgres,
  removing,
  pgSources,
}: ConnectorCardProps) {
  const connected = status !== 'disconnected';
  const isDemo = def.implementation === 'demo';

  return (
    <motion.article
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group flex flex-col rounded-2xl border border-border/70 bg-card/45 shadow-sm backdrop-blur-sm transition-colors',
        'hover:border-border hover:bg-card/65',
      )}
    >
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex gap-3">
          <ConnectorLogo domain={def.logoDomain} name={def.name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
                {def.name}
              </h2>
              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                {CONNECTOR_CATEGORY_LABELS[def.category]}
              </Badge>
              {isDemo && connected ? (
                <Badge variant="secondary" className="text-[10px]">
                  Preview
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{def.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {def.implementation === 'postgresql' && count && count > 1 ? (
            <Badge variant="outline" className="text-[10px]">
              {count} connections
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
          <div className="text-[11px] text-muted-foreground">
            <span className="font-mono text-foreground/70">Last sync</span>{' '}
            <span>{formatRelativeTime(lastSyncAt)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {!connected ? (
              <Button
                type="button"
                size="sm"
                className="h-8"
                disabled={!canManage}
                onClick={onConnect}
              >
                Connect
              </Button>
            ) : (
              <>
                <Button type="button" variant="secondary" size="sm" className="h-8" onClick={onManage}>
                  Manage
                </Button>
                {isDemo && canManage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground"
                    onClick={onDisconnectDemo}
                  >
                    <X className="size-3.5" aria-hidden />
                  </Button>
                ) : null}
              </>
            )}
            <button
              type="button"
              onClick={onToggleExpand}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'h-8 gap-1 px-2 text-muted-foreground',
              )}
              aria-expanded={expanded}
            >
              Details
              <ChevronDown
                className={cn('size-3.5 transition-transform', expanded && 'rotate-180')}
                aria-hidden
              />
            </button>
          </div>
        </div>

        {status === 'syncing' ? (
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary/80"
              initial={{ width: '12%' }}
              animate={{ width: ['12%', '88%', '40%', '100%'] }}
              transition={{
                duration: reduceMotion ? 0 : 2.2,
                repeat: reduceMotion ? 0 : Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div className="border-t border-border/60 bg-muted/10 px-4 py-4 text-xs">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Shield className="size-3.5 text-muted-foreground" aria-hidden />
            Agent permissions
          </p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li className="flex gap-2">
              <ChevronRight className="mt-0.5 size-3 shrink-0 opacity-60" aria-hidden />
              Read structured metrics and dimensions exposed by this connector.
            </li>
            <li className="flex gap-2">
              <ChevronRight className="mt-0.5 size-3 shrink-0 opacity-60" aria-hidden />
              Publish briefs and scheduled digests to approved channels only.
            </li>
            <li className="flex gap-2">
              <ChevronRight className="mt-0.5 size-3 shrink-0 opacity-60" aria-hidden />
              No destructive writes without an explicit automation policy.
            </li>
          </ul>

          {def.implementation === 'postgresql' && pgSources.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="font-medium text-foreground">PostgreSQL instances</p>
              {pgSources.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {c.host}:{c.port} / {c.database} · {c.username}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px]"
                        disabled={testing}
                        onClick={() => onTestPostgres(c.id)}
                      >
                        Test
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-7 text-[11px]"
                        disabled={removing}
                        onClick={() => onRemovePostgres(c.id)}
                      >
                        <Trash2 className="size-3" aria-hidden />
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </motion.article>
  );
}
