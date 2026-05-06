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

export type NotificationListParams = {
  cursor?: string;
  limit?: number;
  unreadOnly?: boolean;
  category?: string;
};
