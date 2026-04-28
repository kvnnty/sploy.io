import Image from "next/image";
import Link from "next/link";

import { WaitlistForm } from "./waitlist-form";

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#07080a] text-[#f9f9f9]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-80"
        aria-hidden
      >
        <div className="absolute left-1/2 top-[-14rem] h-[36rem] w-[min(92vw,44rem)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(85,179,255,0.12),transparent_58%)]" />
        <div className="absolute bottom-[-18%] right-[-8%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,99,99,0.06),transparent_62%)]" />
      </div>

      <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 pb-16 pt-20 sm:px-8 sm:pt-28">
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
            className="h-8 w-28 sm:h-9"
            priority
          />
        </Link>

        <div className="mt-16 flex flex-1 flex-col sm:mt-20">
          <h1
            className="text-balance text-[2rem] font-semibold leading-tight tracking-[-0.02em] sm:text-[2.5rem]"
            style={{ fontFeatureSettings: '"liga" 0, "ss02" 1, "ss08" 1' }}
          >
            Join the waitlist
          </h1>
          <p className="mt-4 max-w-md text-pretty text-[16px] font-medium leading-relaxed tracking-[0.02em] text-[#9c9c9d]">
            We’re opening early access soon. Leave your email and we’ll notify
            you when Sploy is ready—no spam.
          </p>

          <div className="mt-10 w-full">
            <WaitlistForm />
            <p className="mt-4 text-[12px] font-medium tracking-[0.02em] text-[#6a6b6c]">
              We use your email only for Sploy updates. Unsubscribe anytime.
            </p>
          </div>
        </div>

        <footer className="mt-auto border-t border-white/[0.06] pt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] font-medium tracking-[0.02em] text-[#6a6b6c]">
              © {new Date().getFullYear()} Sploy
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] tracking-[0.04em] text-[#9c9c9d]">
              <Link href="#" className="transition-opacity hover:opacity-60">
                Privacy
              </Link>
              <Link href="#" className="transition-opacity hover:opacity-60">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
