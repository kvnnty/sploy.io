import { cn } from '@/lib/utils';

import { Icon } from './icon';
import type { IconComponent } from './types';

const variantStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/20 text-foreground ring-1 ring-primary/30',
  accent: 'bg-accent text-accent-foreground',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
} as const;

const sizeStyles = {
  sm: 'size-8 rounded-lg [&_svg]:size-3.5',
  md: 'size-10 rounded-xl [&_svg]:size-5',
  lg: 'size-12 rounded-xl [&_svg]:size-6',
  xl: 'size-14 rounded-2xl [&_svg]:size-7',
} as const;

export function IconBadge({
  icon,
  variant = 'default',
  size = 'md',
  className,
}: {
  icon: IconComponent;
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      <Icon icon={icon} className="opacity-90" />
    </div>
  );
}

