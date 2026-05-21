import { cn } from '@/lib/utils';

export function AnalyticsHeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-full max-w-[280px] text-foreground', className)}
      aria-hidden
    >
      <rect x="24" y="32" width="272" height="136" rx="16" className="fill-card stroke-border" strokeWidth="1.5" />
      <rect x="40" y="48" width="80" height="8" rx="4" className="fill-muted" />
      <rect x="40" y="64" width="120" height="6" rx="3" className="fill-muted/60" />
      <path
        d="M48 148 L88 118 L128 132 L168 92 L208 108 L248 72 L272 88"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
      <circle cx="88" cy="118" r="5" className="fill-primary stroke-card" strokeWidth="2" />
      <circle cx="168" cy="92" r="5" className="fill-primary stroke-card" strokeWidth="2" />
      <circle cx="248" cy="72" r="5" className="fill-primary stroke-card" strokeWidth="2" />
      <rect x="40" y="156" width="32" height="4" rx="2" className="fill-muted-foreground/30" />
      <rect x="88" y="156" width="32" height="4" rx="2" className="fill-muted-foreground/30" />
      <rect x="136" y="156" width="32" height="4" rx="2" className="fill-muted-foreground/30" />
      <rect x="184" y="156" width="32" height="4" rx="2" className="fill-muted-foreground/30" />
      <rect x="232" y="156" width="32" height="4" rx="2" className="fill-muted-foreground/30" />
      <circle cx="268" cy="44" r="20" className="fill-primary/25 stroke-primary/50" strokeWidth="1" />
      <path
        d="M262 44 L266 48 L274 38"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground"
      />
    </svg>
  );
}
