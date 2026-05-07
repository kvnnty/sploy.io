/** Central query keys for TanStack Query — use for invalidation and prefetch. */
export const queryKeys = {
  auth: {
    root: ['auth'] as const,
    me: () => [...queryKeys.auth.root, 'me'] as const,
    teams: () => [...queryKeys.auth.root, 'teams'] as const,
    providers: () => [...queryKeys.auth.root, 'providers'] as const,
  },
  team: {
    root: ['team'] as const,
    detail: () => [...queryKeys.team.root, 'detail'] as const,
    activity: () => [...queryKeys.team.root, 'activity'] as const,
  },
  user: {
    root: ['user'] as const,
    profile: () => [...queryKeys.user.root, 'profile'] as const,
  },
  sessions: {
    root: ['sessions'] as const,
    list: () => [...queryKeys.sessions.root, 'list'] as const,
  },
  notifications: {
    root: ['notifications'] as const,
    unreadCount: () => [...queryKeys.notifications.root, 'unread-count'] as const,
    preview: () => [...queryKeys.notifications.root, 'list', 'preview'] as const,
    history: (filter: string) =>
      [...queryKeys.notifications.root, 'history', filter] as const,
    preferences: () => [...queryKeys.notifications.root, 'preferences'] as const,
  },
} as const;
