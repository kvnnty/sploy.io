import type { SVGProps } from 'react';

import { cn } from '@/lib/utils';

import type { IconComponent } from './types';

export type IconProps = SVGProps<SVGSVGElement> & {
  icon: IconComponent;
  className?: string;
};

export function Icon({ icon: IconComponent, className, ...props }: IconProps) {
  return (
    <IconComponent
      className={cn('size-4 shrink-0', className)}
      aria-hidden={props['aria-hidden'] ?? true}
      {...props}
    />
  );
}
