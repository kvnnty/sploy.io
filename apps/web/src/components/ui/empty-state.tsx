import type { ReactNode } from 'react';

import { Icon } from '@/components/icons/icon';
import type { IconComponent } from '@/components/icons/types';
import { cn } from '@/lib/utils';

export function EmptyState({
  illustration,
  icon,
  title,
  description,
  action,
  className,
}: {
  illustration?: ReactNode;
  icon?: IconComponent;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center',
        className,
      )}
    >
      {illustration ? <div className="mb-6 opacity-90">{illustration}</div> : null}
      {!illustration && icon ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25">
          <Icon icon={icon} className="size-7 text-foreground" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
