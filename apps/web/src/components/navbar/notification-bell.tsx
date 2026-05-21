'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationPreviewQuery,
} from '@/hooks/useNotifications';
import { useNotifications } from '@/components/notifications/notification-provider';
import type { NotificationItem } from '@/types/notification.types';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { unreadCount, refreshCount } = useNotifications();
  const [open, setOpen] = useState(false);

  const { data, isPending, isFetching } = useNotificationPreviewQuery({
    enabled: open,
  });

  const items = data?.items ?? [];
  const loading = open && isPending && items.length === 0;

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllMutation = useMarkAllNotificationsReadMutation();

  async function handleMarkAllRead() {
    await markAllMutation.mutateAsync();
    void queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.preview(),
    });
    void refreshCount();
  }

  async function handleClick(notification: NotificationItem) {
    if (!notification.read) {
      await markReadMutation.mutateAsync(notification.id);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.preview(),
      });
      void refreshCount();
    }
    if (notification.actionUrl) {
      setOpen(false);
      router.push(notification.actionUrl);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'relative border-border size-10',
        )}
        aria-label="Open notifications"
      >
        <Bell className="size-5" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-96 max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Notifications
          </h3>
          {items.some((n) => !n.read) && (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={markAllMutation.isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" aria-hidden />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-2.5 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto mb-2 size-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <ul role="list" aria-busy={isFetching}>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void handleClick(n)}
                    disabled={markReadMutation.isPending}
                    className={cn(
                      'flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-60',
                      !n.read && 'bg-primary/4',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          'text-sm leading-snug',
                          !n.read
                            ? 'font-semibold text-foreground'
                            : 'text-foreground',
                        )}
                      >
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    {n.body && (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-0.5 text-[11px] text-muted-foreground/70">
                      {timeAgo(n.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-4 py-2.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push('/dashboard/settings/notifications');
            }}
            className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all notifications
            <ExternalLink className="size-3" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
