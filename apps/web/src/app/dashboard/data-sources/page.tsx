import {
  apiFetchServer,
  type DataSourceSummary,
} from '@/lib/api';
import { loadDashboardData } from '@/lib/dashboard-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function DataSourcesPage() {
  const { accessToken, activeOrgId, apiAvailable, me, orgs } =
    await loadDashboardData();

  let sources: DataSourceSummary[] = [];
  let loadError: string | null = null;

  if (apiAvailable && activeOrgId && me.internalUserId) {
    try {
      sources = await apiFetchServer<DataSourceSummary[]>(
        `/orgs/${activeOrgId}/data-sources`,
        accessToken,
      );
    } catch (e) {
      loadError = e instanceof Error ? e.message : 'Failed to load data sources';
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Data sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connections used for verified queries and natural-language answers. Add and
          manage sources via the API{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            POST /api/orgs/:orgId/data-sources
          </code>
          — a configuration UI will land here next.
        </p>
      </div>

      {!apiAvailable ? (
        <Card className="border-border bg-muted/30 ring-border">
          <CardHeader>
            <CardTitle className="text-base">API unavailable</CardTitle>
            <CardDescription>
              Start the backend or set <code className="font-mono text-xs">NEXT_PUBLIC_API_URL</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {apiAvailable && !me.internalUserId ? (
        <Card className="border-border bg-muted/30 ring-border">
          <CardHeader>
            <CardTitle className="text-base">Finish setup</CardTitle>
            <CardDescription>
              Create a workspace from the overview before managing data sources.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {apiAvailable && me.internalUserId && !orgs.length ? (
        <Card className="border-border bg-muted/30 ring-border">
          <CardHeader>
            <CardTitle className="text-base">No organization</CardTitle>
            <CardDescription>
              Create an organization from the dashboard overview to continue.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {loadError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      {apiAvailable && activeOrgId && me.internalUserId && !loadError ? (
        sources.length === 0 ? (
          <Card className="border-dashed border-border bg-transparent ring-border">
            <CardHeader>
              <CardTitle className="text-base">No sources yet</CardTitle>
              <CardDescription>
                When you add a PostgreSQL-compatible source, it will appear here with
                host and database metadata (never passwords).
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="space-y-3">
            {sources.map((s) => (
              <Card
                key={s.id}
                className="border-border bg-muted/30 ring-border"
                size="sm"
              >
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {s.host}:{s.port}/{s.database}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-border capitalize">
                    {s.kind}
                  </Badge>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  User <span className="font-mono text-foreground/80">{s.username}</span>
                </CardContent>
              </Card>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
