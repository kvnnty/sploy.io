import { cn } from '@/lib/utils';

export function FeatureOrbitIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-full max-w-md text-foreground', className)}
      aria-hidden
    >
      <circle cx="200" cy="120" r="72" className="fill-primary/10 stroke-primary/25" strokeWidth="1.5" strokeDasharray="6 4" />
      <circle cx="200" cy="120" r="44" className="fill-card stroke-border" strokeWidth="1.5" />
      <circle cx="200" cy="120" r="16" className="fill-primary" />
      <rect x="176" y="108" width="48" height="24" rx="6" className="fill-foreground/5" />
      <circle cx="80" cy="60" r="28" className="fill-card stroke-border" strokeWidth="1.5" />
      <rect x="68" y="52" width="24" height="16" rx="3" className="fill-primary/40" />
      <circle cx="320" cy="60" r="28" className="fill-card stroke-border" strokeWidth="1.5" />
      <path d="M308 68 L332 52 L332 76 Z" className="fill-primary/50" />
      <circle cx="64" cy="180" r="28" className="fill-card stroke-border" strokeWidth="1.5" />
      <rect x="52" y="172" width="24" height="16" rx="2" className="fill-muted" />
      <circle cx="336" cy="180" r="28" className="fill-card stroke-border" strokeWidth="1.5" />
      <path
        d="M324 188 L336 172 L348 188"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary"
      />
      <path d="M108 72 L168 100" className="stroke-border" strokeWidth="1" strokeDasharray="4 3" />
      <path d="M292 72 L232 100" className="stroke-border" strokeWidth="1" strokeDasharray="4 3" />
      <path d="M88 168 L168 132" className="stroke-border" strokeWidth="1" strokeDasharray="4 3" />
      <path d="M312 168 L232 132" className="stroke-border" strokeWidth="1" strokeDasharray="4 3" />
    </svg>
  );
}
