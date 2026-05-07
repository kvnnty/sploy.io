'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useDeleteAccountMutation,
  useUpdateProfileMutation,
} from '@/hooks/useUser';
import {
  useRevokeSessionMutation,
  useSessionsQuery,
} from '@/hooks/useSessions';

function ProfileSection() {
  const { user } = useUser();
  const [displayName, setDisplayName] = useState(
    user?.fullName ?? user?.firstName ?? '',
  );
  const [saved, setSaved] = useState(false);

  const updateProfile = useUpdateProfileMutation();

  async function handleSave() {
    setSaved(false);
    try {
      await updateProfile.mutateAsync({ displayName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* error via mutation */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="Avatar"
              className="size-14 rounded-full ring-1 ring-border"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
              {(user?.firstName?.[0] ?? user?.emailAddresses[0]?.emailAddress[0] ?? '?').toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p className="truncate text-sm text-foreground">
              {user?.emailAddresses[0]?.emailAddress ?? '—'}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="display-name" className="text-xs font-medium text-muted-foreground">
            Display name
          </label>
          <div className="flex items-center gap-2">
            <input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Button
              onClick={() => void handleSave()}
              disabled={updateProfile.isPending}
              size="default"
            >
              {saved ? 'Saved' : updateProfile.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionsSection() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const sessionsQuery = useSessionsQuery({ enabled: shouldLoad });
  const revoke = useRevokeSessionMutation();

  const sessions = sessionsQuery.data;
  const list = sessions ?? [];

  async function revokeSession(id: string) {
    await revoke.mutateAsync(id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {!shouldLoad ? (
          <Button variant="outline" onClick={() => setShouldLoad(true)} size="sm">
            Load sessions
          </Button>
        ) : sessionsQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {list.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {s.browser} · {s.device}
                    {s.current && (
                      <span className="ml-2 text-xs text-primary">(current)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.ipAddress ?? ''}</p>
                </div>
                {!s.current && (
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => void revokeSession(s.id)}
                    disabled={revoke.isPending && revoke.variables === s.id}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const deleteAccount = useDeleteAccountMutation();

  async function handleDelete() {
    try {
      await deleteAccount.mutateAsync();
      window.location.href = '/';
    } catch {
      setConfirming(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Delete Account</p>
            <p className="text-xs text-muted-foreground">
              This action cannot be undone. All your data will be permanently removed.
            </p>
          </div>
          {!confirming ? (
            <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
              Delete Account
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleDelete()}
                disabled={deleteAccount.isPending}
              >
                {deleteAccount.isPending ? 'Deleting…' : 'Confirm Delete'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <ProfileSection />
      <SessionsSection />
      <DangerZone />
    </div>
  );
}
