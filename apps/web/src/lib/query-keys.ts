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
  dataSources: {
    root: ['data-sources'] as const,
    list: (teamId: string) =>
      [...queryKeys.dataSources.root, 'list', teamId] as const,
    schema: (teamId: string, dataSourceId: string) =>
      [...queryKeys.dataSources.root, 'schema', teamId, dataSourceId] as const,
  },
  analysis: {
    root: ['analysis'] as const,
    runs: (teamId: string) =>
      [...queryKeys.analysis.root, 'runs', teamId] as const,
    run: (teamId: string, runId: string) =>
      [...queryKeys.analysis.root, 'run', teamId, runId] as const,
    slack: (teamId: string) =>
      [...queryKeys.analysis.root, 'slack', teamId] as const,
  },
  imports: {
    root: ['imports'] as const,
    list: (teamId: string) =>
      [...queryKeys.imports.root, 'list', teamId] as const,
  },
  billing: {
    root: ['billing'] as const,
    status: (teamId: string) =>
      [...queryKeys.billing.root, 'status', teamId] as const,
    invoices: (teamId: string) =>
      [...queryKeys.billing.root, 'invoices', teamId] as const,
  },
} as const;
