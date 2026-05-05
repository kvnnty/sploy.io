/** Central query keys for TanStack Query — use for invalidation and prefetch. */
export const queryKeys = {
  notifications: {
    root: ['notifications'] as const,
    unreadCount: () => [...queryKeys.notifications.root, 'unread-count'] as const,
    preview: () => [...queryKeys.notifications.root, 'list', 'preview'] as const,
    history: (filter: string) =>
      [...queryKeys.notifications.root, 'history', filter] as const,
    preferences: () => [...queryKeys.notifications.root, 'preferences'] as const,
  },
} as const;
