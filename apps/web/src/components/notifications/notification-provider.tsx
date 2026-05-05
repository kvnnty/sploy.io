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
import {
  createNotificationStream,
  fetchUnreadCount,
  type NotificationItem,
} from '@/lib/notifications';

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] =
    useState<NotificationItem | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const { count } = await fetchUnreadCount(token);
      setUnreadCount(count);
    } catch {
      // silently ignore
    }
  }, [getToken]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

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
            setUnreadCount(payload.count);
          }
          if (event.type === 'notification') {
            setLatestNotification(event.payload as NotificationItem);
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
  }, [getToken]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, refreshCount, latestNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
