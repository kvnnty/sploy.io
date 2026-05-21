import type { LucideIcon } from 'lucide-react';
import type { ForwardRefExoticComponent, SVGProps } from 'react';

/** Heroicons outline/solid icon component */
export type HeroIcon = ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, 'ref'> & {
    title?: string;
    titleId?: string;
  }
>;

/** Any icon from Lucide or Heroicons */
export type IconComponent = LucideIcon | HeroIcon;

export type IconSource = 'lucide' | 'hero';
