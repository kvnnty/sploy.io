import type { AxiosInstance } from 'axios';

import type {
  NotificationCategory,
  NotificationListParams,
  NotificationListResponse,
  NotificationPreference,
} from '@/types/notification.types';

export class NotificationService {
  constructor(private readonly http: AxiosInstance) {}

  async list(
    opts: NotificationListParams = {},
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams();
    if (opts.cursor) params.set('cursor', opts.cursor);
    if (opts.limit != null) params.set('limit', String(opts.limit));
    if (opts.unreadOnly) params.set('unreadOnly', 'true');
    if (opts.category) params.set('category', opts.category);
    const qs = params.toString();
    const r = await this.http.get<NotificationListResponse>(
      `/notifications${qs ? `?${qs}` : ''}`,
    );
    return r.data;
  }

  async unreadCount(): Promise<{ count: number }> {
    const r = await this.http.get<{ count: number }>(
      '/notifications/unread-count',
    );
    return r.data;
  }

  async markRead(id: string): Promise<unknown> {
    const r = await this.http.patch(`/notifications/${id}/read`);
    return r.data as unknown;
  }

  async markUnread(id: string): Promise<unknown> {
    const r = await this.http.patch(`/notifications/${id}/unread`);
    return r.data as unknown;
  }

  async markAllRead(): Promise<unknown> {
    const r = await this.http.post('/notifications/read-all');
    return r.data as unknown;
  }

  async delete(id: string): Promise<unknown> {
    const r = await this.http.delete(`/notifications/${id}`);
    return r.data as unknown;
  }

  async getPreferences(): Promise<NotificationPreference[]> {
    const r = await this.http.get<NotificationPreference[]>(
      '/notifications/preferences',
    );
    return r.data;
  }

  async updatePreference(
    category: NotificationCategory,
    data: { inAppEnabled?: boolean; emailEnabled?: boolean },
  ): Promise<NotificationPreference> {
    const r = await this.http.patch<NotificationPreference>(
      '/notifications/preferences',
      {
        category,
        ...data,
      },
    );
    return r.data;
  }
}
