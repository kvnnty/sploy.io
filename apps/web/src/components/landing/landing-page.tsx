"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Countdown from "./countdown";
import People from "./people";
import { WaitlistForm } from "./waitlist-form";

export function LandingPage({ waitlistPeople }: { waitlistPeople: number }) {
  const year = useMemo(() => new Date().getFullYear(), []);
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <main className="relative flex min-h-screen w-full flex-1 flex-col overflow-hidden px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >   
        <div className="absolute inset-0 opacity-[0.1] [background-image:radial-gradient(rgba(255,255,255)_0.7px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <div className="flex w-full max-w-2xl flex-1 self-center flex-col items-center justify-center gap-6">
        <div className="mb-6 flex flex-col items-center justify-center gap-6">
          <Link
            href="/"
            className="inline-flex w-fit transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(202,100%,67%/0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080a]"
            aria-label="Sploy home"
          >
            <Image
              src="/sploylogo-white.svg"
              alt="Sploy"
              width={410}
              height={85}
              className="h-9 w-28 sm:h-10 sm:w-32"
              priority
            />
          </Link>
        </div>

        <div className="flex max-w-2xl flex-col items-center justify-center gap-4">
          <div className="relative flex items-center gap-4 rounded-full border border-white/10 px-4 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-400" />
            </span>
            <p className="text-xs font-medium uppercase text-[#cfcfd0]">Launching soon</p>
          </div>
          <h1
            className="text-balance text-center text-4xl font-bold text-[#f9f9f9]"
            style={{ fontFeatureSettings: '"liga" 0, "ss02" 1, "ss08" 1' }}
          >
            {isSuccess ? "You're on the waitlist" : "Get early Access"}
          </h1>
          <p className="max-w-xl text-center text-base text-[#9c9c9d]">
            {isSuccess
              ? "You secured your spot. We will reach out as soon as your invite is ready."
              : "Stop waiting on dashboards and backlogged analysts.\nGet the why behind every metric and the exact next move in seconds."}
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col items-center justify-center gap-2 mt-4">
          <WaitlistForm onSuccessChange={setIsSuccess} />
        </div>

        <div className="flex items-center justify-center gap-2">
          <People count={waitlistPeople} />
        </div>
        <Countdown period={new Date("2026-07-01")} />
      </div>

      <footer className="mx-auto mt-14 w-full max-w-5xl border-t border-white/10 pt-6">
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-[#8a8b8d] sm:flex-row">
          <p className="tracking-[0.02em]">© {year} Sploy. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link
              href="#"
              className="transition-colors hover:text-[#d5d5d6] focus-visible:outline-none focus-visible:text-[#d5d5d6]"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="transition-colors hover:text-[#d5d5d6] focus-visible:outline-none focus-visible:text-[#d5d5d6]"
            >
              Terms
            </Link>
            <Link
              href="mailto:hello@kvnn.guru"
              className="transition-colors hover:text-[#d5d5d6] focus-visible:outline-none focus-visible:text-[#d5d5d6]"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
