"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BoltIcon,
  ChartBarSquareIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { Icon } from "@/components/icons/icon";
import { FeatureOrbitIllustration } from "@/components/illustrations";
import { ThemeToggle } from "@/components/theme-toggle";
import Countdown from "./countdown";
import People from "./people";
import { WaitlistForm } from "./waitlist-form";
import Logo from "../shared/logo";

const features = [
  {
    title: "Instant insights",
    description: "Get the why behind every metric in seconds, not days.",
    icon: BoltIcon,
  },
  {
    title: "Explainable analysis",
    description: "Every chart and recommendation comes with clear reasoning.",
    icon: ChartBarSquareIcon,
  },
  {
    title: "Enterprise ready",
    description: "SSO, team workspaces, and connectors for your stack.",
    icon: ShieldCheckIcon,
  },
] as const;

export function LandingPage({ waitlistPeople }: { waitlistPeople: number }) {
  const year = useMemo(() => new Date().getFullYear(), []);
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <main className="relative flex min-h-screen w-full flex-1 flex-col overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.22)_1px,transparent_1px)] bg-size-[20px_20px] opacity-[0.12] dark:bg-[radial-gradient(rgba(255,255,255,0.7)_0.7px,transparent_1px)] dark:opacity-[0.1]" />
        <div className="absolute -right-24 top-32 hidden opacity-50 lg:block">
          <FeatureOrbitIllustration className="max-w-xs" />
        </div>
        <div className="absolute left-1/2 top-0 size-[480px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 self-center">
        <div className="mb-6 flex flex-col items-center justify-center gap-6">
          <Logo />
        </div>

        <div className="flex max-w-2xl flex-col items-center justify-center gap-4">
          <div className="relative flex items-center gap-4 rounded-full border border-border bg-card/80 px-4 py-1 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              <RocketLaunchIcon className="size-3.5" aria-hidden />
              Launching soon
            </p>
          </div>
          <h1
            className="text-balance text-center text-4xl font-bold text-foreground"
            style={{ fontFeatureSettings: '"liga" 0, "ss02" 1, "ss08" 1' }}
          >
            {isSuccess ? "You're on the waitlist" : "Get early Access"}
          </h1>
          <p className="max-w-xl whitespace-pre-line text-center text-base text-muted-foreground">
            {isSuccess
              ? "You secured your spot. We will reach out as soon as your invite is ready."
              : "Stop waiting on dashboards and backlogged analysts.\nGet the why behind every metric and the exact next move in seconds."}
          </p>
        </div>

        <div className="mt-4 flex w-full max-w-md flex-col items-center justify-center gap-2">
          <WaitlistForm onSuccessChange={setIsSuccess} />
        </div>

        <div className="flex items-center justify-center gap-2">
          <People count={waitlistPeople} />
        </div>
        <Countdown period={new Date("2026-07-01")} />

        {!isSuccess ? (
          <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card/80 p-4 text-left shadow-sm backdrop-blur-sm"
              >
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/25">
                  <Icon icon={feature.icon} className="size-5 text-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-foreground">
            <LightBulbIcon className="size-4" aria-hidden />
            Invite friends to move up the list
          </div>
        )}
      </div>

      <footer className="mx-auto mt-14 w-full max-w-5xl border-t border-border pt-6">
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p className="tracking-[0.02em]">© {year} Sploy. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <Link
              href="/pricing"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="#"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="mailto:hello@kvnn.guru"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
            >
              Contact
            </Link>
            <Link
              href="/auth/login"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
            >
              Join beta
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </main>
  );
}
