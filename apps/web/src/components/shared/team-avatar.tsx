'use client';

import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

const PALETTE = [
  'bg-blue-600',
  'bg-violet-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-teal-600',
];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]!;
}

export function TeamAvatar({
  name,
  logoUrl,
  size = 'md',
  className,
}: {
  name: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'size-6 text-[10px]',
    md: 'size-8 text-xs',
    lg: 'size-12 text-base',
  };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={cn(
          'shrink-0 rounded-lg object-cover',
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg font-semibold text-white',
        sizeClasses[size],
        colorFromName(name),
        className,
      )}
      title={name}
    >
      {getInitials(name) || '?'}
    </div>
  );
}
