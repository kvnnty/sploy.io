import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { loadDashboardData } from '@/lib/dashboard-data';

export default async function AskPage() {
  const { activeOrgId, apiAvailable, me, orgs } = await loadDashboardData();

  const canAsk =
    apiAvailable && Boolean(me.internalUserId && activeOrgId && orgs.length);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ask</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Natural-language questions become validated SQL against a chosen data source,
          with results you can trace. This screen will host the full Q&amp;A flow; the
          API already exposes{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            POST /api/orgs/:orgId/data-sources/:dataSourceId/ask
          </code>
          .
        </p>
      </div>

      {!canAsk ? (
        <Card className="border-border bg-muted/30 ring-border">
          <CardHeader>
            <CardTitle className="text-base">Almost there</CardTitle>
            <CardDescription>
              {!apiAvailable
                ? 'Connect to the API from the overview, then add at least one data source.'
                : 'Complete workspace setup and add a data source to unlock Ask.'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="border-dashed border-border bg-muted/20 ring-border">
          <CardHeader>
            <CardTitle className="text-base">Question composer</CardTitle>
            <CardDescription>
              You are signed in with an active organization (
              <span className="font-mono text-foreground/90">{activeOrgId}</span>). A
              guided prompt, schema hints, and result preview will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
              Placeholder UI — wire to Ask endpoint after selecting a data source.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
