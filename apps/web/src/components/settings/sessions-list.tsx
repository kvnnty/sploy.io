'use client';

import { AlertTriangle, Monitor, Smartphone } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SessionInfo } from '@/types';
import {
  useRevokeOtherSessionsMutation,
  useRevokeSessionMutation,
  useSessionsQuery,
} from '@/hooks/useSessions';

function formatLocation(session: SessionInfo) {
  if (session.location.city && session.location.country) {
    return `${session.location.city}, ${session.location.country}`;
  }
  return session.location.country ?? 'Unknown location';
}

export function SessionsList() {
  const sessionsQuery = useSessionsQuery();
  const revokeOne = useRevokeSessionMutation();
  const revokeOthers = useRevokeOtherSessionsMutation();

  const sessions = sessionsQuery.data ?? [];
  const loading = sessionsQuery.isPending;
  const error = sessionsQuery.isError
    ? 'Could not load active sessions.'
    : null;

  const currentSession = useMemo(() => {
    const list = sessionsQuery.data ?? [];
    return list.find((s) => s.current);
  }, [sessionsQuery.data]);

  async function handleLogoutSession(id: string) {
    await revokeOne.mutateAsync(id);
  }

  async function handleLogoutOthers() {
    const ok = window.confirm('Log out of all other sessions? This keeps your current device signed in.');
    if (!ok) return;
    await revokeOthers.mutateAsync();
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Review and revoke devices currently signed into your account.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={revokeOthers.isPending || sessions.length <= 1}
            onClick={() => void handleLogoutOthers()}
          >
            {revokeOthers.isPending ? 'Logging out…' : 'Log out of all other sessions'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading sessions…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const isCurrent = session.current;
              const Icon = /mobile|tablet/i.test(session.device) ? Smartphone : Monitor;
              const busyOne = revokeOne.isPending && revokeOne.variables === session.id;
              return (
                <div
                  key={session.id}
                  className={`rounded-xl border p-4 ${isCurrent ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Icon className="size-4 opacity-80" aria-hidden />
                        {session.device} · {session.browser}
                        {isCurrent ? <Badge>This device</Badge> : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        IP: {session.ipAddress ?? 'Unknown'} · {formatLocation(session)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last active: {new Date(session.lastActiveAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isCurrent || busyOne}
                      onClick={() => void handleLogoutSession(session.id)}
                    >
                      {busyOne ? 'Logging out…' : 'Log out'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {currentSession ? null : (
          <p className="mt-3 flex items-center gap-2 border-l-2 border-primary/35 pl-3 text-xs text-muted-foreground">
            <AlertTriangle className="size-3.5 shrink-0 text-primary" aria-hidden />
            Current session could not be identified from your token.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
