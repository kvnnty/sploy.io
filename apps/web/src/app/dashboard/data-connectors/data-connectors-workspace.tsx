'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { useActiveTeamId } from '@/components/dashboard/active-team-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { DASHBOARD_ROUTES } from '@/lib/dashboard-titles';
import type { CreateDataSourceBody } from '@/types/data-source.types';
import { useAuthService, useDataSourcesService } from '@/hooks/service-instances';
import { ApiError } from '@/lib/axios';

const t = DASHBOARD_ROUTES.dataConnectors;

const emptyForm: CreateDataSourceBody = {
  name: '',
  host: '',
  port: 5432,
  database: '',
  username: '',
  password: '',
};

export function DataConnectorsWorkspace() {
  const teamId = useActiveTeamId();
  const auth = useAuthService();
  const dataSourcesApi = useDataSourcesService();
  const qc = useQueryClient();

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

  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<CreateDataSourceBody>(emptyForm);

  const membershipRole =
    teamsQuery.data?.find((t) => t.team_id === teamId)?.role ?? '';
  const canManage =
    membershipRole === 'owner' || membershipRole === 'admin';

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
      toast.success('Connector added');
      setForm(emptyForm);
      setExpanded(false);
      void qc.invalidateQueries({
        queryKey: queryKeys.dataSources.list(teamId!),
      });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : 'Could not add connector';
      toast.error(msg);
    },
  });

  const testMutation = useMutation({
    mutationFn: (dataSourceId: string) =>
      dataSourcesApi.testConnection(teamId!, dataSourceId),
    onSuccess: () => toast.success('Connection OK'),
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : 'Connection test failed';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (dataSourceId: string) =>
      dataSourcesApi.remove(teamId!, dataSourceId),
    onSuccess: () => {
      toast.success('Connector removed');
      void qc.invalidateQueries({
        queryKey: queryKeys.dataSources.list(teamId!),
      });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : 'Could not remove connector';
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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <DashboardPageHeader title={t.pageTitle} description={t.description} />

      {!teamId ? (
        <p className="text-sm text-muted-foreground">
          Select a team to manage connectors.
        </p>
      ) : sourcesQuery.isPending ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading connectors…
        </div>
      ) : sourcesQuery.isError ? (
        <p className="text-sm text-destructive">
          Could not load connectors. Is the API running?
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard/ask"
              className={cn(buttonVariants({ variant: 'outline' }), 'text-xs')}
            >
              Open Ask
            </Link>
            {canManage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpanded((e) => !e)}
              >
                {expanded ? 'Cancel' : 'Add PostgreSQL'}
              </Button>
            ) : null}
          </div>

          {!canManage ? (
            <p className="text-xs text-muted-foreground">
              Only team owners and admins can add or remove connectors.
            </p>
          ) : null}

          {expanded && canManage ? (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-foreground">
                  Name
                  <input
                    className={cn(
                      'mt-1 flex h-9 w-full rounded-lg border border-border bg-background px-2 text-sm',
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
                      'mt-1 flex h-9 w-full rounded-lg border border-border bg-background px-2 text-sm',
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
                      'mt-1 flex h-9 w-full rounded-lg border border-border bg-background px-2 text-sm',
                      'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                    )}
                    value={form.port}
                    onChange={(e) =>
                      updateField('port', Number.parseInt(e.target.value, 10) || 5432)
                    }
                  />
                </label>
                <label className="text-sm font-medium text-foreground">
                  Database
                  <input
                    className={cn(
                      'mt-1 flex h-9 w-full rounded-lg border border-border bg-background px-2 text-sm',
                      'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                    )}
                    value={form.database}
                    onChange={(e) => updateField('database', e.target.value)}
                  />
                </label>
                <label className="text-sm font-medium text-foreground">
                  Username
                  <input
                    className={cn(
                      'mt-1 flex h-9 w-full rounded-lg border border-border bg-background px-2 text-sm',
                      'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                    )}
                    autoComplete="off"
                    value={form.username}
                    onChange={(e) => updateField('username', e.target.value)}
                  />
                </label>
                <label className="text-sm font-medium text-foreground">
                  Password
                  <input
                    type="password"
                    className={cn(
                      'mt-1 flex h-9 w-full rounded-lg border border-border bg-background px-2 text-sm',
                      'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                    )}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                  />
                </label>
              </div>
              <Button
                type="button"
                disabled={createMutation.isPending || creating}
                onClick={() => void createMutation.mutateAsync()}
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
            </div>
          ) : null}

          <div className="space-y-3">
            {(sourcesQuery.data ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/15 p-6 text-center text-sm text-muted-foreground">
                No connectors yet.
                {canManage
                  ? ' Use “Add PostgreSQL” above.'
                  : ' Ask an admin to connect your warehouse.'}
              </p>
            ) : (
              (sourcesQuery.data ?? []).map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.kind} · {c.host}:{c.port} / {c.database} ·{' '}
                      {c.username}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={testMutation.isPending}
                      onClick={() => void testMutation.mutateAsync(c.id)}
                    >
                      Test
                    </Button>
                    {canManage ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (
                            typeof window !== 'undefined' &&
                            window.confirm(`Remove connector “${c.name}”?`)
                          ) {
                            void deleteMutation.mutateAsync(c.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
