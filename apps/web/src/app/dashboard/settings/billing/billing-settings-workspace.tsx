'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowUpRight,
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useActiveTeamId } from '@/components/dashboard/active-team-provider';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthService, useBillingService } from '@/hooks/service-instances';
import {
  PLAN_LABEL,
  PLAN_PRICE_LABEL,
  statusLabel,
  upgradesAvailableFor,
} from '@/lib/billing-display';
import { queryKeys } from '@/lib/query-keys';
import type { BillingPlan } from '@/types/billing.types';
import type { TeamMembership } from '@/types';
import { cn } from '@/lib/utils';

/** Self-serve paid tiers shown for upgrade/downgrade context (Growth is positioned as flagship). */
const SELF_SERVE_PLANS_ORDERED: Exclude<BillingPlan, 'free' | 'enterprise'>[] = [
  'starter',
  'growth',
  'pro',
];

const TIER_RANK: Record<BillingPlan, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
  enterprise: 4,
};

function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

function tierForUsagePct(pct: number): 'ok' | 'warn' | 'danger' {
  if (pct >= 100) return 'danger';
  if (pct >= 80) return 'warn';
  return 'ok';
}

function UsageMeter({
  label,
  caption,
  used,
  limit,
}: {
  label: string;
  caption?: string;
  used: number;
  limit: number;
}) {
  const pctRaw = limit > 0 ? (used / limit) * 100 : 0;
  const pct = Math.min(100, pctRaw);
  const tier = tierForUsagePct(pctRaw);

  const barTone =
    tier === 'danger'
      ? 'bg-destructive'
      : tier === 'warn'
        ? 'bg-amber-500'
        : 'bg-primary';

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {caption ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
          ) : null}
        </div>
        <p className="shrink-0 tabular-nums text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{used.toLocaleString()}</span>
          <span className="text-muted-foreground"> / </span>
          {limit.toLocaleString()}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', barTone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function canManageTeamBilling(teamId: string | null, teams: TeamMembership[] | undefined) {
  if (!teamId || !teams?.length) return false;
  const m = teams.find((t) => t.team_id === teamId);
  return m?.role === 'owner' || m?.role === 'admin';
}

export function BillingSettingsWorkspace() {
  const teamId = useActiveTeamId();
  const searchParams = useSearchParams();
  const billingApi = useBillingService();
  const auth = useAuthService();
  const qc = useQueryClient();
  const [portalBusy, setPortalBusy] = useState(false);

  const teamsQuery = useQuery({
    queryKey: queryKeys.auth.teams(),
    queryFn: () => auth.getTeams(),
    enabled: Boolean(teamId),
  });

  const isAdmin = canManageTeamBilling(teamId, teamsQuery.data);

  const statusQuery = useQuery({
    queryKey: queryKeys.billing.status(teamId ?? ''),
    queryFn: () => billingApi.status(teamId!),
    enabled: Boolean(teamId),
  });

  const invoicesQuery = useQuery({
    queryKey: queryKeys.billing.invoices(teamId ?? ''),
    queryFn: () => billingApi.invoices(teamId!),
    enabled: Boolean(teamId),
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: Exclude<BillingPlan, 'free' | 'enterprise'>) =>
      billingApi.checkoutSession({ teamId: teamId!, plan }),
    onSuccess: (r) => {
      if (r.url) window.location.href = r.url;
      else toast.error('Checkout could not be started.');
    },
    onError: () => toast.error('Could not start checkout. Try again.'),
  });

  useEffect(() => {
    const ok = searchParams.get('checkout') === 'success';
    if (!ok || !teamId) return;
    void qc.invalidateQueries({ queryKey: queryKeys.billing.status(teamId) });
    void qc.invalidateQueries({ queryKey: queryKeys.billing.invoices(teamId) });
    toast.success('Subscription updated. Usage may take a minute to refresh.');
    window.history.replaceState(null, '', '/dashboard/settings/billing');
  }, [searchParams, teamId, qc]);

  const s = statusQuery.data;

  const upgradePlans = useMemo(() => {
    if (!s) return [];
    return upgradesAvailableFor(s.plan);
  }, [s]);

  if (!teamId) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">No workspace selected</CardTitle>
          <CardDescription>
            Choose a workspace from the sidebar or header to manage billing for that team.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const loading =
    statusQuery.isPending || (teamsQuery.isPending && Boolean(teamId));

  if (loading && !s) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-8 animate-spin" aria-hidden />
      </div>
    );
  }

  if (statusQuery.isError || !s) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Could not load billing</CardTitle>
          <CardDescription>Check your connection and try again.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" size="sm" onClick={() => void statusQuery.refetch()}>
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const statusTone =
    s.status === 'past_due' || s.status === 'unpaid'
      ? 'border-amber-500/35 bg-amber-500/[0.06] text-amber-900 dark:text-amber-100'
      : s.status === 'canceled'
        ? 'border-border bg-muted/40 text-muted-foreground'
        : 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-900 dark:text-emerald-100';

  const invoices = invoicesQuery.data?.invoices ?? [];
  const hasPortal = Boolean(s.stripeCustomerId);

  return (
    <div className="space-y-8">
      {s.status === 'past_due' || s.status === 'unpaid' ? (
        <div className="flex gap-3 rounded-xl border border-amber-500/35 bg-amber-500/8 px-4 py-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" />
          <div>
            <p className="font-medium text-foreground">Payment requires attention</p>
            <p className="mt-1 text-muted-foreground">
              Your workspace billing is{' '}
              <span className="font-medium text-foreground">{statusLabel(s.status).toLowerCase()}</span>
              .
              {isAdmin ? ' Update the payment method in the billing portal to avoid interruption.' : ' Ask an owner or admin to update billing.'}
            </p>
          </div>
        </div>
      ) : null}

      {s.warnings.length ? (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-foreground">Approaching plan limits</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {s.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <div className="h-1 bg-linear-to-r from-primary/80 via-primary/40 to-muted" aria-hidden />
        <CardHeader className="space-y-1 pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-xl font-semibold tracking-tight">
                {PLAN_LABEL[s.plan]} plan
              </CardTitle>
              <CardDescription className="mt-1">
                {PLAN_PRICE_LABEL[s.plan]}
                {' · '}Workspace billing
              </CardDescription>
            </div>
            <Badge variant="outline" className={cn('shrink-0 border font-normal', statusTone)}>
              {statusLabel(s.status)}
              {s.cancelAtPeriodEnd ? ' · ends this period' : ''}
            </Badge>
          </div>
          <div className="pt-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Billing period:</span>{' '}
            {formatShortDate(s.billingPeriod.start)} — {formatShortDate(s.billingPeriod.end)}
          </div>
        </CardHeader>
        <CardFooter className="flex flex-wrap items-center gap-2 border-t border-border/70 bg-muted/20 px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!isAdmin || !hasPortal || portalBusy}
            onClick={() => {
              void (async () => {
                setPortalBusy(true);
                try {
                  const { url } = await billingApi.portalSession(teamId);
                  if (url) window.location.href = url;
                  else toast.error('Portal session unavailable.');
                } catch {
                  toast.error('Could not open billing portal.');
                } finally {
                  setPortalBusy(false);
                }
              })();
            }}
          >
            {portalBusy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Opening…
              </>
            ) : (
              <>
                <CreditCard className="size-4" aria-hidden />
                Manage billing
              </>
            )}
          </Button>
          {!hasPortal && isAdmin ? (
            <span className="text-xs text-muted-foreground">
              Subscribe to enable the Stripe portal for invoices and payment methods.
            </span>
          ) : null}
          {!isAdmin ? (
            <span className="text-xs text-muted-foreground">
              Only workspace owners and admins can change billing.
            </span>
          ) : null}
          <Link
            href="/pricing"
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Compare plans <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </CardFooter>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[1fr,minmax(260px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Usage this period</CardTitle>
            <CardDescription>
              Metered against your workspace plan through{' '}
              {formatShortDate(s.usage.periodEnd)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <UsageMeter
              label="AI queries"
              caption="Natural language analysis and NL → SQL workloads."
              used={s.usage.aiQueries}
              limit={s.limits.maxAiQueriesPerPeriod}
            />
            <UsageMeter
              label="Agent runs"
              caption="Scheduled investigations and analyst jobs."
              used={s.usage.agentRuns}
              limit={s.limits.maxAgentRunsPerPeriod}
            />
            <UsageMeter
              label="Actions executed"
              caption="Automations across Slack, Jira, exports, and webhooks."
              used={s.usage.actionExecutions}
              limit={s.limits.maxActionsPerPeriod}
            />
            <UsageMeter
              label="Connected data sources"
              caption={`${s.usage.connectorUsages.toLocaleString()} connector usage events billed this period (metered signals).`}
              used={s.connectorCount}
              limit={s.limits.maxConnectors}
            />
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Plans</CardTitle>
            <CardDescription>
              Upgrade for higher caps. Downgrades and seat changes use the billing portal once you are
              subscribed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {s.plan === 'enterprise' ? (
              <p className="text-xs text-muted-foreground">
                Enterprise workspaces use custom contracts. Self-serve tiers are shown for reference — changes
                go through your Sploy contact or the billing portal.
              </p>
            ) : null}

            {SELF_SERVE_PLANS_ORDERED.map((plan) => {
              if (s.plan === 'enterprise') {
                const price = PLAN_PRICE_LABEL[plan];
                return (
                  <div
                    key={plan}
                    className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{PLAN_LABEL[plan]}</p>
                      <p className="text-xs text-muted-foreground">{price}</p>
                    </div>
                    <Badge variant="outline" className="font-normal">
                      Reference
                    </Badge>
                  </div>
                );
              }

              const active = s.plan === plan;
              const upgradeTarget = upgradePlans.includes(plan);
              const lowerTierThanCurrent =
                TIER_RANK[plan] < TIER_RANK[s.plan] && ['starter', 'growth', 'pro'].includes(s.plan);
              const price = PLAN_PRICE_LABEL[plan];

              return (
                <div
                  key={plan}
                  className={cn(
                    'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
                    active ? 'border-primary/40 bg-primary/4' : 'border-border bg-card',
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{PLAN_LABEL[plan]}</p>
                    <p className="text-xs text-muted-foreground">{price}</p>
                  </div>
                  {active ? (
                    <Badge variant="secondary">Current</Badge>
                  ) : upgradeTarget ? (
                    <Button
                      size="sm"
                      disabled={!isAdmin || checkoutMutation.isPending}
                      onClick={() => checkoutMutation.mutate(plan)}
                    >
                      {checkoutMutation.isPending && checkoutMutation.variables === plan ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Checkout…
                        </>
                      ) : (
                        <>
                          Upgrade to {PLAN_LABEL[plan]}
                          <ExternalLink className="ml-1 size-3 opacity-70" aria-hidden />
                        </>
                      )}
                    </Button>
                  ) : lowerTierThanCurrent ? (
                    <span className="max-w-[220px] text-right text-xs text-muted-foreground">
                      Downgrade in billing portal once subscribed.
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Lower‑tier option</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Invoice history</CardTitle>
          <CardDescription>Recent Stripe invoices for this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesQuery.isPending ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : invoices.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No invoices yet — they will appear here after your first payment.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              <div className="grid grid-cols-[1fr_minmax(0,100px)_minmax(0,108px)_auto] gap-3 px-4 py-2.5 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground md:grid-cols-[1fr_minmax(0,112px)_minmax(0,120px)_auto]">
                <span>Invoice</span>
                <span>Date</span>
                <span>Amount</span>
                <span className="text-right md:text-right">View</span>
              </div>
              {invoices.map((inv) => {
                const date = new Date(inv.created * 1000);
                const amount =
                  inv.status === 'paid' || inv.amountDue === 0
                    ? inv.amountPaid
                    : inv.amountDue;
                const viewUrl = inv.hostedInvoiceUrl ?? inv.invoicePdf;

                return (
                  <div
                    key={inv.id}
                    className="grid grid-cols-1 gap-3 px-4 py-3 text-sm sm:grid-cols-[1fr_minmax(0,112px)_minmax(0,120px)_auto] md:grid-cols-[1fr_minmax(0,112px)_minmax(0,120px)_auto] md:items-center"
                  >
                    <div className="min-w-0 font-medium tabular-nums text-foreground">
                      {inv.number ?? inv.id.slice(0, 12)}
                      <span className="ml-2 rounded-md border border-border/80 px-1.5 py-0.5 text-[0.65rem] font-normal uppercase tracking-wide text-muted-foreground">
                        {inv.status}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {Intl.DateTimeFormat(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(date)}
                    </div>
                    <div className="tabular-nums text-foreground">{formatMoney(amount, inv.currency)}</div>
                    <div className="flex md:justify-end">
                      {viewUrl ? (
                        <a
                          href={viewUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                            'gap-1 text-primary',
                          )}
                        >
                          Open <ArrowUpRight className="size-3.5" aria-hidden />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
