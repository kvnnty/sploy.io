'use client';

import { CircleHelp, ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { helpLinks } from '@/config/help-links';
import { cn } from '@/lib/utils';

export function HelpDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'border-border size-10',
        )}
        aria-label="Open help menu"
      >
        <CircleHelp className="size-5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-56 p-1.5">
        {helpLinks.map(({ label, href, icon: Icon }) => (
          <DropdownMenuLinkItem
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            closeOnClick
            className="flex items-center justify-between gap-2 px-2.5 py-2"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{label}</span>
            </span>
            <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
          </DropdownMenuLinkItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
