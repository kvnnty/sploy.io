'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createNotificationStream,
  fetchUnreadCount,
  type NotificationItem,
} from '@/lib/notifications';
import { queryKeys } from '@/lib/query-keys';

interface NotificationContextValue {
  unreadCount: number;
  refreshCount: () => Promise<void>;
  latestNotification: NotificationItem | null;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refreshCount: async () => {},
  latestNotification: null,
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [latestNotification, setLatestNotification] =
    useState<NotificationItem | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const { data: unreadData } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const token = await getToken();
      if (!token) return { count: 0 };
      return fetchUnreadCount(token);
    },
  });

  const refreshCount = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.unreadCount(),
    });
  }, [queryClient]);

  useEffect(() => {
    let mounted = true;

    async function connect() {
      const token = await getToken();
      if (!token || !mounted) return;

      controllerRef.current = createNotificationStream(
        token,
        (event) => {
          if (!mounted) return;
          if (event.type === 'unread_count') {
            const payload = event.payload as { count: number };
            queryClient.setQueryData(queryKeys.notifications.unreadCount(), {
              count: payload.count,
            });
          }
          if (event.type === 'notification') {
            setLatestNotification(event.payload as NotificationItem);
            void queryClient.invalidateQueries({
              queryKey: queryKeys.notifications.root,
            });
          }
        },
        () => {
          if (!mounted) return;
          setTimeout(connect, 5000);
        },
      );
    }

    connect();

    return () => {
      mounted = false;
      controllerRef.current?.abort();
    };
  }, [getToken, queryClient]);

  const unreadCount = unreadData?.count ?? 0;

  return (
    <NotificationContext.Provider
      value={{ unreadCount, refreshCount, latestNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
