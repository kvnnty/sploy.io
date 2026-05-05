'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Bell, CheckCheck, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/components/notifications/notification-provider';
import {
  fetchNotifications,
  fetchNotificationPreferences,
  updateNotificationPreference,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationCategory,
  type NotificationPreference,
} from '@/lib/notifications';
import { queryKeys } from '@/lib/query-keys';

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  account_security: 'Account & Security',
  team_collaboration: 'Team & Collaboration',
  system_product: 'System & Product',
};

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'account_security', label: 'Account' },
  { value: 'team_collaboration', label: 'Team' },
  { value: 'system_product', label: 'System' },
] as const;

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

export default function NotificationsSettingsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { refreshCount } = useNotifications();
  const [filter, setFilter] = useState<string>('all');

  const historyQuery = useInfiniteQuery({
    queryKey: queryKeys.notifications.history(filter),
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const opts: {
        cursor?: string;
        limit: number;
        unreadOnly?: boolean;
        category?: string;
      } = { limit: 20, cursor: pageParam };
      if (filter === 'unread') opts.unreadOnly = true;
      else if (filter !== 'all') opts.category = filter;
      return fetchNotifications(token, opts);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const items =
    historyQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const prefsQuery = useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return fetchNotificationPreferences(token);
    },
    staleTime: 60_000,
  });

  const invalidateNotificationQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.root,
    });
    void refreshCount();
  };

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      await markNotificationRead(token, id);
    },
    onSuccess: invalidateNotificationQueries,
  });

  const markUnreadMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      await markNotificationUnread(token, id);
    },
    onSuccess: invalidateNotificationQueries,
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      await markAllNotificationsRead(token);
    },
    onSuccess: invalidateNotificationQueries,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      await deleteNotification(token, id);
    },
    onSuccess: invalidateNotificationQueries,
  });

  const prefMutation = useMutation({
    mutationFn: async ({
      category,
      field,
      value,
    }: {
      category: NotificationCategory;
      field: 'inAppEnabled' | 'emailEnabled';
      value: boolean;
    }) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return updateNotificationPreference(token, category, {
        [field]: value,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.preferences(),
      });
    },
  });

  const loading = historyQuery.isPending;
  const prefsLoading = prefsQuery.isPending;
  const preferences = prefsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View and manage all your notifications.
              </CardDescription>
            </div>
            {items.some((n) => !n.read) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void markAllMutation.mutateAsync()}
                disabled={markAllMutation.isPending}
              >
                <CheckCheck className="size-3.5" data-icon="inline-start" />
                Mark all read
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === f.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {historyQuery.isError ? (
            <p className="text-sm text-destructive">
              Could not load notifications.
            </p>
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto mb-3 size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <>
              <ul role="list" className="divide-y divide-border">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 py-3',
                      !n.read && 'bg-primary/3',
                    )}
                  >
                    {!n.read && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                    {n.read && <span className="mt-1.5 size-2 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm leading-snug',
                          !n.read
                            ? 'font-semibold text-foreground'
                            : 'text-foreground',
                        )}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {timeAgo(n.createdAt)}
                        <span className="mx-1.5">·</span>
                        {CATEGORY_LABELS[n.category] ?? n.category}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {n.read ? (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() =>
                            void markUnreadMutation.mutateAsync(n.id)
                          }
                          disabled={markUnreadMutation.isPending}
                          aria-label="Mark unread"
                        >
                          <EyeOff className="size-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => void markReadMutation.mutateAsync(n.id)}
                          disabled={markReadMutation.isPending}
                          aria-label="Mark read"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => void deleteMutation.mutateAsync(n.id)}
                        disabled={deleteMutation.isPending}
                        aria-label="Delete notification"
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              {historyQuery.hasNextPage ? (
                <div className="pt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyQuery.isFetchingNextPage}
                    onClick={() => void historyQuery.fetchNextPage()}
                  >
                    {historyQuery.isFetchingNextPage
                      ? 'Loading…'
                      : 'Load more'}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Control how you receive notifications for each category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prefsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-48 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {preferences.map((pref) => (
                <div
                  key={pref.category}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-sm font-medium text-foreground">
                    {CATEGORY_LABELS[pref.category] ?? pref.category}
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={pref.inAppEnabled}
                        onChange={() =>
                          void prefMutation.mutateAsync({
                            category: pref.category,
                            field: 'inAppEnabled',
                            value: !pref.inAppEnabled,
                          })
                        }
                        disabled={prefMutation.isPending}
                        className="size-4 rounded border-border accent-primary"
                      />
                      In-app
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={pref.emailEnabled}
                        disabled
                        className="size-4 rounded border-border accent-primary opacity-50"
                      />
                      <span className="opacity-50">
                        Email <span className="text-[10px]">(coming soon)</span>
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
