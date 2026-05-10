import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";

import Logo from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "$49",
    cadence: "/mo",
    description: "AI analyst for startup data.",
    outcome: "Replace spreadsheet digging.",
    cta: "Join beta",
    href: "/auth/sign-up",
    featured: false,
    note: null,
    limits: [
      "50 active insights/month",
      "3 data connectors",
      "1 workspace",
      "1 user included",
    ],
    features: [
      "Natural language Ask",
      "Slack and email delivery",
      "Limited scheduled reports",
      "Insight history",
    ],
  },
  {
    name: "Growth",
    price: "$149",
    cadence: "/mo",
    description: "Automated analytics for growing teams.",
    outcome: "Replace recurring analyst work.",
    cta: "Start with Growth",
    href: "/auth/sign-up",
    featured: true,
    note: "+ $15 per extra user",
    limits: [
      "300 active insights/month",
      "10 data connectors",
      "5 users included",
      "Scheduled monitoring",
    ],
    features: [
      "Slack, email, Teams, and WhatsApp reports",
      "Basic anomaly detection",
      "Shared dashboards and insight history",
      "CSV, webhook, and Jira-light exports",
    ],
  },
  {
    name: "Pro",
    price: "$599",
    cadence: "/mo",
    description: "Autonomous analytics layer for your company.",
    outcome: "Replace BI workflows.",
    cta: "Talk to sales",
    href: "mailto:hello@kvnn.guru?subject=Sploy%20Pro",
    featured: false,
    note: "+ $20 per extra user",
    limits: [
      "2,000 active insights/month",
      "30 data connectors",
      "15 users included",
      "3 workspaces",
    ],
    features: [
      "Multi-agent workflows",
      "Advanced anomaly detection",
      "Slack, Jira, Notion, webhook, and WhatsApp actions",
      "RBAC, audit logs, and trust layer",
    ],
  },
] as const;

const billingDimensions = [
  "Active insights delivered",
  "Data connectors",
  "Agents and workflows",
  "Team seats",
  "Delivery channels",
  "Action destinations",
] as const;

function PlanCard({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <section
      className={cn(
        "relative flex min-h-[520px] flex-col rounded-2xl border bg-card p-6",
        plan.featured
          ? "border-foreground shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:border-foreground"
          : "border-border",
      )}
    >
      {plan.featured ? (
        <Badge className="absolute right-5 top-5 bg-foreground text-background">
          Recommended
        </Badge>
      ) : null}

      <p className="text-sm text-muted-foreground">{plan.outcome}</p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">{plan.name}</h2>
      <p className="mt-2 min-h-10 text-sm leading-6 text-muted-foreground">
        {plan.description}
      </p>

      <div className="mt-7 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
        <span className="text-sm text-muted-foreground">{plan.cadence}</span>
      </div>
      {plan.note ? <p className="mt-2 text-xs text-muted-foreground">{plan.note}</p> : null}

      <Link
        href={plan.href}
        className={cn(
          "mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition",
          plan.featured
            ? "bg-foreground text-background hover:opacity-90"
            : "border border-border bg-background hover:bg-muted",
        )}
      >
        {plan.cta}
        <ArrowRight className="size-4" aria-hidden />
      </Link>

      <div className="mt-7 border-t border-border pt-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Included
        </p>
        <ul className="space-y-2">
          {plan.limits.map((metric) => (
            <li key={metric} className="mt-3 flex items-center gap-2 text-sm">
              <Check className="size-4 text-muted-foreground" aria-hidden />
              {metric}
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PricingPage() {
  return (
    <main className="relative min-h-screen bg-background px-5 py-6 text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,120,120,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,120,120,0.08)_1px,transparent_1px)] bg-size-[48px_48px]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Logo size="sm" />
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
          <Link href="/" className="transition hover:text-foreground">
            Home
          </Link>
          <Link href="/pricing" className="text-foreground">
            Pricing
          </Link>
          <Link href="/auth/login" className="transition hover:text-foreground">
            Login
          </Link>
        </nav>
        <Link
          href="/auth/sign-up"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium transition hover:bg-muted"
        >
          Join beta
        </Link>
      </header>

      <section className="mx-auto w-full max-w-6xl pb-12 pt-20">
        <Badge variant="outline" className="rounded-full bg-background/80 px-3">
          Pricing
        </Badge>
        <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Decision intelligence priced around outcomes.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Sploy is billed by the things that create business value: data sources,
          workflows, team access, delivered insights, and the channels where reports
          become action.
        </p>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </section>

      <section className="mx-auto mt-4 w-full max-w-6xl rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.8fr_auto] lg:items-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Enterprise</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Decision infrastructure for larger organizations.
            </p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Custom limits, onboarding, metrics layer, agent tuning, SLAs, compliance
            review, deep integrations, and VPC/on-prem options as the product matures.
          </p>
          <Link
            href="mailto:hello@kvnn.guru?subject=Sploy%20Enterprise"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
          >
            Contact
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-12 w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid border-b border-border px-5 py-4 text-sm font-medium text-muted-foreground sm:grid-cols-[1.2fr_repeat(3,1fr)]">
          <span>Billing dimension</span>
          <span className="hidden sm:block">Starter</span>
          <span className="hidden sm:block">Growth</span>
          <span className="hidden sm:block">Pro</span>
        </div>
        {billingDimensions.map((dimension, index) => (
          <div
            key={dimension}
            className={cn(
              "grid gap-3 px-5 py-4 text-sm sm:grid-cols-[1.2fr_repeat(3,1fr)]",
              index !== billingDimensions.length - 1 && "border-b border-border",
            )}
          >
            <span className="font-medium">{dimension}</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <Check className="size-4" aria-hidden />
              Limited
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-4" aria-hidden />
              Included
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-4" aria-hidden />
              Advanced
            </span>
          </div>
        ))}
        <div className="flex flex-col gap-3 border-t border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Delivery channels include Slack, email, Teams, WhatsApp, Telegram, SMS,
            webhooks, Notion, Jira, and Linear depending on plan.
          </span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Minus className="size-4" aria-hidden />
            No token pricing
          </span>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 py-12 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Active Insights Delivered counts useful findings, reports, alerts, and accepted actions.
        </span>
        <Link href="/" className="transition hover:text-foreground">
          Back home
        </Link>
      </footer>
    </main>
  );
}
