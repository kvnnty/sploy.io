'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useNotificationService } from '@/hooks/service-instances';
import { queryKeys } from '@/lib/query-keys';
import type {
  NotificationCategory,
  NotificationListParams,
} from '@/types/notification.types';

function invalidateNotificationQueries(
  qc: ReturnType<typeof useQueryClient>,
) {
  void qc.invalidateQueries({ queryKey: queryKeys.notifications.root });
}

export function useNotificationUnreadCountQuery() {
  const notifications = useNotificationService();
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      try {
        return await notifications.unreadCount();
      } catch {
        return { count: 0 };
      }
    },
  });
}

export function useNotificationPreviewQuery(options: { enabled?: boolean }) {
  const notifications = useNotificationService();
  const { enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.notifications.preview(),
    queryFn: () => notifications.list({ limit: 8 }),
    enabled,
  });
}

export function useNotificationHistoryInfiniteQuery(filter: string) {
  const notifications = useNotificationService();
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.history(filter),
    queryFn: async ({ pageParam }) => {
      const opts: NotificationListParams = {
        limit: 20,
        cursor: pageParam,
      };
      if (filter === 'unread') opts.unreadOnly = true;
      else if (filter !== 'all') opts.category = filter;
      return notifications.list(opts);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useNotificationPreferencesQuery() {
  const notifications = useNotificationService();
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: () => notifications.getPreferences(),
    staleTime: 60_000,
  });
}

export function useMarkNotificationReadMutation() {
  const notifications = useNotificationService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notifications.markRead(id),
    onSuccess: () => invalidateNotificationQueries(qc),
  });
}

export function useMarkNotificationUnreadMutation() {
  const notifications = useNotificationService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notifications.markUnread(id),
    onSuccess: () => invalidateNotificationQueries(qc),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const notifications = useNotificationService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notifications.markAllRead(),
    onSuccess: () => invalidateNotificationQueries(qc),
  });
}

export function useDeleteNotificationMutation() {
  const notifications = useNotificationService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notifications.delete(id),
    onSuccess: () => invalidateNotificationQueries(qc),
  });
}

export function useUpdateNotificationPreferenceMutation() {
  const notifications = useNotificationService();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: {
      category: NotificationCategory;
      field: 'inAppEnabled' | 'emailEnabled';
      value: boolean;
    }) =>
      notifications.updatePreference(opts.category, {
        [opts.field]: opts.value,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.notifications.preferences(),
      });
    },
  });
}
