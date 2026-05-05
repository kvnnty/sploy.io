import { apiFetchWithToken, API_URL } from './api';

export type NotificationCategory =
  | 'account_security'
  | 'team_collaboration'
  | 'system_product';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  type: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  nextCursor: string | null;
}

export interface NotificationPreference {
  category: NotificationCategory;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export async function fetchNotifications(
  token: string,
  opts: {
    cursor?: string;
    limit?: number;
    unreadOnly?: boolean;
    category?: string;
  } = {},
): Promise<NotificationListResponse> {
  const params = new URLSearchParams();
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.unreadOnly) params.set('unreadOnly', 'true');
  if (opts.category) params.set('category', opts.category);
  const qs = params.toString();
  return apiFetchWithToken<NotificationListResponse>(
    `/notifications${qs ? `?${qs}` : ''}`,
    token,
  );
}

export async function fetchUnreadCount(
  token: string,
): Promise<{ count: number }> {
  return apiFetchWithToken('/notifications/unread-count', token);
}

export async function markNotificationRead(
  token: string,
  id: string,
): Promise<void> {
  await apiFetchWithToken(`/notifications/${id}/read`, token, {
    method: 'PATCH',
  });
}

export async function markNotificationUnread(
  token: string,
  id: string,
): Promise<void> {
  await apiFetchWithToken(`/notifications/${id}/unread`, token, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead(
  token: string,
): Promise<void> {
  await apiFetchWithToken('/notifications/read-all', token, {
    method: 'POST',
  });
}

export async function deleteNotification(
  token: string,
  id: string,
): Promise<void> {
  await apiFetchWithToken(`/notifications/${id}`, token, {
    method: 'DELETE',
  });
}

export async function fetchNotificationPreferences(
  token: string,
): Promise<NotificationPreference[]> {
  return apiFetchWithToken<NotificationPreference[]>(
    '/notifications/preferences',
    token,
  );
}

export async function updateNotificationPreference(
  token: string,
  category: NotificationCategory,
  data: { inAppEnabled?: boolean; emailEnabled?: boolean },
): Promise<NotificationPreference> {
  return apiFetchWithToken<NotificationPreference>(
    '/notifications/preferences',
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ category, ...data }),
    },
  );
}

export function createNotificationStream(
  token: string,
  onEvent: (event: { type: string; payload: unknown }) => void,
  onError?: () => void,
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_URL}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        onError?.();
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              onEvent(parsed);
            } catch {
              // skip malformed frames
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        onError?.();
      }
    }
  })();

  return controller;
}
