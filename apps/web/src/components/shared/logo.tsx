import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/"
      className="inline-flex w-fit transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(202,100%,67%/0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080a]"
      aria-label="Sploy home"
    >
      <Image src="/sploylogo-white.svg" alt="Sploy" width={410} height={85} className="h-9 w-28 sm:h-10 sm:w-32" priority />
    </Link>
  )
}
