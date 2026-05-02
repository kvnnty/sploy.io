import Link from 'next/link';

import { OrgOnboarding } from '@/components/dashboard/org-onboarding';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { loadDashboardData } from '@/lib/dashboard-data';
import { cn } from '@/lib/utils';

export default async function DashboardPage() {
  const { user, me, orgs, activeOrgId, apiAvailable } = await loadDashboardData();

  const needsOrg =
    apiAvailable && me.internalUserId && orgs.length === 0;
  const ready = apiAvailable && activeOrgId;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Decision workspace
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          From metric change to clarity
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Sploy is built for decision velocity: detect what changed, diagnose why, and
          move to action—with evidence you can trust.
        </p>
      </div>

      {!apiAvailable ? (
        <Card className="border-white/10 bg-white/3 ring-white/10">
          <CardHeader>
            <CardTitle>Connect the API</CardTitle>
            <CardDescription>
              The dashboard loads your organization and data sources from the NestJS
              backend. Start it on port 8080 or set{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                NEXT_PUBLIC_API_URL
              </code>
              .
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {apiAvailable && !me.internalUserId ? (
        <OrgOnboarding email={user.email ?? ''} />
      ) : null}

      {needsOrg ? (
        <OrgOnboarding email={user.email ?? ''} />
      ) : null}

      {ready ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-white/10 bg-white/3 ring-white/10">
            <CardHeader>
              <CardTitle className="text-base">Data sources</CardTitle>
              <CardDescription>
                Connect databases your team already trusts. Credentials stay encrypted on
                the server.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/dashboard/data-sources"
                className={cn(buttonVariants({ variant: 'outline' }), 'border-white/15')}
              >
                Manage sources
              </Link>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/3 ring-white/10">
            <CardHeader>
              <CardTitle className="text-base">Ask a question</CardTitle>
              <CardDescription>
                Plain-language questions become verified SQL and tabular answers—ground
                truth for the next decision.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/dashboard/ask"
                className={cn(buttonVariants({ variant: 'outline' }), 'border-white/15')}
              >
                Open Ask
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {ready ? (
        <Card className="border-dashed border-white/15 bg-transparent ring-white/10">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Coming next</CardTitle>
            <CardDescription>
              Ranked root causes, recommended actions with impact estimates, and
              proactive &quot;what changed&quot; briefings—see{' '}
              <span className="text-foreground/80">spec.md</span> in the repo.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
