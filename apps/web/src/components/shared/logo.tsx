import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_BOX = {
  sm: "h-6 w-[5.25rem] sm:h-6 sm:w-[5.25rem]",
  md: "h-9 w-28 sm:h-10 sm:w-32",
  lg: "h-11 w-32",
} as const;

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <Link
      href="/"
      className="inline-flex w-fit transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label="Sploy home"
    >
      <Image
        src="/sploylogo-dark.svg"
        alt="Sploy"
        width={size === 'sm' ? 205 : size === 'md' ? 410 : 820}
        height={size === 'sm' ? 42.5 : size === 'md' ? 85 : 170}
        className={cn("dark:hidden", LOGO_BOX[size])}
        priority
      />
      <Image
        src="/sploylogo-white.svg"
        alt="Sploy"
        width={size === 'sm' ? 205 : size === 'md' ? 410 : 820}
        height={size === 'sm' ? 42.5 : size === 'md' ? 85 : 170}
        className={cn("hidden dark:block", LOGO_BOX[size])}
        priority
      />
    </Link>
  );
}
