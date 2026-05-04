import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex w-fit transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label="Sploy home"
    >
      <Image
        src="/sploylogo-dark.svg"
        alt="Sploy"
        width={410}
        height={85}
        className="h-9 w-28 sm:h-10 sm:w-32 dark:hidden"
        priority
      />
      <Image
        src="/sploylogo-white.svg"
        alt="Sploy"
        width={410}
        height={85}
        className="hidden h-9 w-28 sm:h-10 sm:w-32 dark:block"
        priority
      />
    </Link>
  );
}
