'use client';

import { useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { apiFetchWithToken } from '@/lib/api';

type TeamInfo = {
  id: string;
  name: string;
  slug: string;
};

type MemberInfo = {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: 'owner' | 'admin' | 'member';
};

type InviteInfo = {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
};

function TeamDetails({ team }: { team: TeamInfo }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Name</p>
          <p className="text-sm text-foreground">{team.name}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Slug</p>
          <p className="font-mono text-sm text-foreground">{team.slug}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const roleColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
};

function MembersSection({
  members,
  currentUserId,
  onRefresh,
}: {
  members: MemberInfo[];
  currentUserId: string | null;
  onRefresh: () => void;
}) {
  const { getToken } = useAuth();
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const currentMember = members.find((m) => m.userId === currentUserId);
  const canManage =
    currentMember?.role === 'owner' || currentMember?.role === 'admin';

  async function changeRole(memberId: string, newRole: string) {
    setChangingRole(memberId);
    const token = await getToken();
    if (!token) return;
    try {
      await apiFetchWithToken('/team/role', token, {
        method: 'PATCH',
        body: JSON.stringify({ memberId, role: newRole }),
      });
      onRefresh();
    } finally {
      setChangingRole(null);
    }
  }

  async function removeMember(memberId: string) {
    setRemoving(memberId);
    const token = await getToken();
    if (!token) return;
    try {
      await apiFetchWithToken(`/team/member/${memberId}`, token, {
        method: 'DELETE',
      });
      onRefresh();
    } finally {
      setRemoving(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>
          {members.length} member{members.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {m.displayName ?? m.email}
                  {m.userId === currentUserId && (
                    <span className="ml-1.5 text-xs text-primary">(you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {canManage && m.role !== 'owner' ? (
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    disabled={changingRole === m.id}
                    className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-foreground outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <Badge variant={roleColors[m.role] ?? 'outline'}>{m.role}</Badge>
                )}
                {canManage && m.userId !== currentUserId && m.role !== 'owner' && (
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => removeMember(m.id)}
                    disabled={removing === m.id}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InviteSection({ onRefresh }: { onRefresh: () => void }) {
  const { getToken } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    setSent(false);
    try {
      const token = await getToken();
      if (!token) return;
      await apiFetchWithToken('/team/invite', token, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
      setEmail('');
      onRefresh();
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Members</CardTitle>
        <CardDescription>Send an email invitation to join your team.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <Button type="submit" disabled={sending || !email.trim()}>
            {sent ? 'Sent!' : sending ? 'Sending…' : 'Send Invite'}
          </Button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

function PendingInvites({ invites }: { invites: InviteInfo[] }) {
  const pending = invites.filter((i) => i.status === 'pending');
  if (pending.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pending.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2"
            >
              <p className="text-sm text-foreground">{inv.email}</p>
              <span className="text-xs text-muted-foreground">
                Sent {new Date(inv.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeamSettingsPage() {
  const { getToken } = useAuth();
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [invites, setInvites] = useState<InviteInfo[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadTeam = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const data = await apiFetchWithToken<{
        team: TeamInfo;
        members: MemberInfo[];
        invites: InviteInfo[];
        currentUserId: string;
      }>('/team', token);
      setTeam(data.team);
      setMembers(data.members);
      setInvites(data.invites ?? []);
      setCurrentUserId(data.currentUserId);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, [getToken]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  if (!loaded) {
    return <p className="text-sm text-muted-foreground">Loading team…</p>;
  }

  if (!team) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No team found. Create a workspace first from the dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <TeamDetails team={team} />
      <InviteSection onRefresh={loadTeam} />
      <PendingInvites invites={invites} />
      <MembersSection
        members={members}
        currentUserId={currentUserId}
        onRefresh={loadTeam}
      />
    </div>
  );
}
