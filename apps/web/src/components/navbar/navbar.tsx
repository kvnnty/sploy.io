'use client';

import Link from 'next/link';
import Logo from '@/components/shared/logo';
import { HelpDropdown } from './help-dropdown';
import { NotificationBell } from './notification-bell';
import { ProfileDropdown } from './profile-dropdown';

export function Navbar({
  name,
  email,
  mobileMenu,
}: {
  name: string;
  email: string;
  mobileMenu?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <div className="md:hidden">{mobileMenu}</div>
          <nav className="hidden items-center gap-3 md:flex">
            <Link
              href="/dashboard"
              className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <HelpDropdown />
          <ProfileDropdown name={name} email={email} />
        </div>
      </div>
    </header>
  );
}
