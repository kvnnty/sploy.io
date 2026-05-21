import type { ReactNode } from 'react';

import { IconBadge } from '@/components/icons/icon-badge';
import type { IconComponent } from '@/components/icons/types';
import { cn } from '@/lib/utils';

export function DashboardPageHeader({
  title,
  description,
  icon,
  iconVariant = 'primary',
  className,
  children,
}: {
  title: string;
  description?: string;
  icon?: IconComponent;
  iconVariant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'info';
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {icon ? <IconBadge icon={icon} variant={iconVariant} size="lg" className="hidden sm:flex" /> : null}
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
      </div>
    </header>
  );
}
