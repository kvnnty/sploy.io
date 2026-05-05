import type { LucideIcon } from 'lucide-react';
import { Activity, BookOpen, LifeBuoy, MessageSquareText } from 'lucide-react';

export type HelpLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const helpLinks: HelpLink[] = [
  {
    label: 'Documentation',
    href: process.env.NEXT_PUBLIC_HELP_DOCS_URL ?? 'https://docs.sploy.io',
    icon: BookOpen,
  },
  {
    label: 'Contact Support',
    href: process.env.NEXT_PUBLIC_HELP_SUPPORT_URL ?? 'mailto:support@sploy.io',
    icon: LifeBuoy,
  },
  {
    label: 'Send Feedback',
    href: process.env.NEXT_PUBLIC_HELP_FEEDBACK_URL ?? 'mailto:feedback@sploy.io',
    icon: MessageSquareText,
  },
  {
    label: 'System Status',
    href: process.env.NEXT_PUBLIC_HELP_STATUS_URL ?? 'https://status.sploy.io',
    icon: Activity,
  },
];
