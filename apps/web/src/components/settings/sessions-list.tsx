'use client';

import { AlertTriangle, Monitor, Smartphone } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetchWithToken } from '@/lib/api';

type SessionInfo = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  device: string;
  browser: string;
  location: {
    city: string | null;
    country: string | null;
  };
  lastActiveAt: string;
  current: boolean;
};

function formatLocation(session: SessionInfo) {
  if (session.location.city && session.location.country) {
    return `${session.location.city}, ${session.location.country}`;
  }
  return session.location.country ?? 'Unknown location';
}

export function SessionsList() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyOthers, setBusyOthers] = useState(false);

  const currentSession = useMemo(() => sessions.find((s) => s.current), [sessions]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setSessions([]);
        return;
      }
      const data = await apiFetchWithToken<SessionInfo[]>('/sessions', token);
      setSessions(data);
    } catch {
      setError('Could not load active sessions.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function handleLogoutSession(id: string) {
    setBusyId(id);
    try {
      const token = await getToken();
      if (!token) return;
      await apiFetchWithToken(`/sessions/${id}`, token, { method: 'DELETE' });
      await loadSessions();
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogoutOthers() {
    const ok = window.confirm('Log out of all other sessions? This keeps your current device signed in.');
    if (!ok) return;
    setBusyOthers(true);
    try {
      const token = await getToken();
      if (!token) return;
      await apiFetchWithToken('/sessions/others', token, { method: 'DELETE' });
      await loadSessions();
    } finally {
      setBusyOthers(false);
    }
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
            disabled={busyOthers || sessions.length <= 1}
            onClick={handleLogoutOthers}
          >
            {busyOthers ? 'Logging out…' : 'Log out of all other sessions'}
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
                      disabled={isCurrent || busyId === session.id}
                      onClick={() => handleLogoutSession(session.id)}
                    >
                      {busyId === session.id ? 'Logging out…' : 'Log out'}
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
