'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { TeamAvatar } from '@/components/shared/team-avatar';
import { CreateTeamDialog } from '@/components/dashboard/create-team-dialog';
import { queryKeys } from '@/lib/query-keys';
import {
  useCancelTeamInviteMutation,
  useDeleteTeamMutation,
  useInviteTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useResendTeamInviteMutation,
  useRespondTeamInviteMutation,
  useTeamSettingsQueries,
  useTransferTeamOwnershipMutation,
  useUpdateMemberRoleMutation,
  useUpdateTeamLogoMutation,
  useUpdateTeamMutation,
} from '@/hooks/useTeams';
import type {
  IncomingTeamInvite,
  TeamActivityEntry,
  TeamInfo,
  TeamInviteInfo,
  TeamMemberInfo,
} from '@/types';
import { useQueryClient } from '@tanstack/react-query';

const roleColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
};

const ACTIVITY_LABELS: Record<string, string> = {
  team_created: 'created the team',
  team_renamed: 'renamed the team',
  invite_sent: 'sent an invite',
  invite_accepted: 'accepted an invite',
  invite_declined: 'declined an invite',
  invite_resent: 'resent an invite',
  invite_cancelled: 'cancelled an invite',
  role_changed: 'changed a role',
  ownership_transferred: 'transferred ownership',
  member_removed: 'removed a member',
  member_left: 'left the team',
};

function TeamDetailsCard({
  team,
  canRename,
  canDelete,
}: {
  team: TeamInfo;
  canRename: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);

  const updateTeam = useUpdateTeamMutation();
  const updateLogo = useUpdateTeamLogoMutation();
  const deleteTeam = useDeleteTeamMutation();

  const saving = updateTeam.isPending;
  const uploadingAvatar = updateLogo.isPending;
  const deleting = deleteTeam.isPending;
  const error =
    (updateTeam.error ?? updateLogo.error ?? deleteTeam.error)?.message ??
    null;

  useEffect(() => setName(team.name), [team.name]);

  async function handleRename() {
    if (!name.trim() || name === team.name) {
      setEditing(false);
      return;
    }
    try {
      await updateTeam.mutateAsync({ name: name.trim() });
      setEditing(false);
    } catch {
      /* surfaced via error */
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await updateLogo.mutateAsync(file);
    } catch {
      /* surfaced */
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete() {
    try {
      await deleteTeam.mutateAsync();
      router.push('/dashboard');
      router.refresh();
    } catch {
      /* surfaced */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <TeamAvatar
              name={team.name}
              logoUrl={team.logoUrl}
              size="lg"
              className="size-14 rounded-xl text-lg"
            />
            {canRename && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <span className="size-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Name</p>
              {editing ? (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleRename()}
                    className="flex-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-sm outline-none focus-visible:border-ring"
                    autoFocus
                  />
                  <Button size="xs" onClick={() => void handleRename()} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setEditing(false);
                      setName(team.name);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground">{team.name}</p>
                  {canRename && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditing(true)}
                    >
                      Rename
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Slug</p>
              <p className="font-mono text-sm text-foreground">{team.slug}</p>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {canDelete && (
          <div className="border-t border-border pt-4">
            <AlertDialog>
              <AlertDialogTrigger
                className="inline-flex"
                render={<Button size="xs" variant="destructive" />}
              >
                Delete Team
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleting}
                    onClick={(e) => {
                      e.preventDefault();
                      void handleDelete();
                    }}
                  >
                    {deleting ? 'Deleting…' : 'Confirm Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InviteSection() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [sent, setSent] = useState(false);

  const invite = useInviteTeamMemberMutation();
  const error = invite.error?.message ?? null;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(false);
    try {
      await invite.mutateAsync({ email: email.trim(), role });
      setSent(true);
      setEmail('');
      setRole('member');
      setTimeout(() => setSent(false), 3000);
    } catch {
      /* error state */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Members</CardTitle>
        <CardDescription>
          Send an email invitation to join your team.
        </CardDescription>
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
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
            className="rounded-lg border border-border bg-muted/40 px-2 py-2 text-xs text-foreground outline-none"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" disabled={invite.isPending || !email.trim()}>
            {sent ? 'Sent!' : invite.isPending ? 'Sending…' : 'Send Invite'}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

function IncomingInvitesCard({ invites }: { invites: IncomingTeamInvite[] }) {
  const respond = useRespondTeamInviteMutation();
  const busyId =
    respond.isPending && respond.variables
      ? (respond.variables as { invitationId: string }).invitationId
      : null;

  if (!invites.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations for You</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join other teams.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {inv.teamName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Role: {inv.role} &middot; Sent{' '}
                  {new Date(inv.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  onClick={() =>
                    respond.mutate({
                      action: 'accept',
                      invitationId: inv.id,
                    })
                  }
                  disabled={busyId === inv.id}
                >
                  Accept
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    respond.mutate({
                      action: 'decline',
                      invitationId: inv.id,
                    })
                  }
                  disabled={busyId === inv.id}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MembersCard({
  members,
  invites,
  currentUserId,
  isOwner,
  canManage,
}: {
  members: TeamMemberInfo[];
  invites: TeamInviteInfo[];
  currentUserId: string | null;
  isOwner: boolean;
  canManage: boolean;
}) {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const updateRole = useUpdateMemberRoleMutation();
  const removeMember = useRemoveTeamMemberMutation();
  const transfer = useTransferTeamOwnershipMutation();
  const resend = useResendTeamInviteMutation();
  const cancelInv = useCancelTeamInviteMutation();

  function roleBusy(memberId: string) {
    return (
      updateRole.isPending &&
      (updateRole.variables as { memberId: string } | undefined)?.memberId ===
        memberId
    );
  }

  function removeBusy(memberId: string) {
    return (
      removeMember.isPending &&
      removeMember.variables === memberId
    );
  }

  function transferBusy(memberId: string) {
    return transfer.isPending && transfer.variables === memberId;
  }

  function pendingInviteBusy(inviteId: string) {
    return (
      (resend.isPending && resend.variables === inviteId) ||
      (cancelInv.isPending && cancelInv.variables === inviteId)
    );
  }

  const anyBusyId =
    updateRole.isPending
      ? (updateRole.variables as { memberId: string })?.memberId
      : removeMember.isPending
        ? removeMember.variables
        : transfer.isPending
          ? transfer.variables
          : null;

  async function changeRole(memberId: string, newRole: string) {
    try {
      await updateRole.mutateAsync({ memberId, role: newRole });
    } catch {
      /* noop */
    }
  }

  async function removeMemberConfirm(memberId: string) {
    try {
      await removeMember.mutateAsync(memberId);
      setConfirmRemove(null);
    } catch {
      /* noop */
    }
  }

  async function transferOwnership(memberId: string) {
    try {
      await transfer.mutateAsync(memberId);
    } catch {
      /* noop */
    }
  }

  async function resendInvite(inviteId: string) {
    try {
      await resend.mutateAsync(inviteId);
    } catch {
      /* noop */
    }
  }

  async function cancelInvite(inviteId: string) {
    try {
      await cancelInv.mutateAsync(inviteId);
    } catch {
      /* noop */
    }
  }

  const pending = invites.filter((i) => i.status === 'pending');
  const totalCount = members.length + pending.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>
          {totalCount} {totalCount === 1 ? 'person' : 'people'}
          {pending.length > 0 && ` (${pending.length} pending)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalCount === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No team members yet.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const isYou = m.userId === currentUserId;
              const canChangeRole =
                canManage &&
                !isYou &&
                m.role !== 'owner' &&
                (isOwner || m.role !== 'admin');

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {m.displayName ?? m.email}
                      {isYou && (
                        <Badge variant="outline" className="ml-1.5 text-[10px]">
                          You
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canChangeRole ? (
                      <select
                        value={m.role}
                        onChange={(e) =>
                          void changeRole(m.id, e.target.value)
                        }
                        disabled={roleBusy(m.id)}
                        className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-foreground outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <Badge variant={roleColors[m.role] ?? 'outline'}>
                        {m.role}
                      </Badge>
                    )}
                    {isOwner && !isYou && m.role !== 'owner' && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => void transferOwnership(m.id)}
                        disabled={transferBusy(m.id)}
                      >
                        Make Owner
                      </Button>
                    )}
                    {canManage &&
                      !isYou &&
                      m.role !== 'owner' &&
                      (isOwner || m.role !== 'admin') &&
                      (confirmRemove === m.id ? (
                        <>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => void removeMemberConfirm(m.id)}
                            disabled={removeBusy(m.id)}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setConfirmRemove(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => setConfirmRemove(m.id)}
                          disabled={anyBusyId === m.id}
                        >
                          Remove
                        </Button>
                      ))}
                  </div>
                </div>
              );
            })}

            {pending.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/15 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {inv.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Invited as {inv.role} &middot;{' '}
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    Pending
                  </Badge>
                  {canManage && (
                    <>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => void resendInvite(inv.id)}
                        disabled={pendingInviteBusy(inv.id)}
                      >
                        Resend
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => void cancelInvite(inv.id)}
                        disabled={pendingInviteBusy(inv.id)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityCard({ activity }: { activity: TeamActivityEntry[] }) {
  if (!activity.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Recent team activity (last 50 events).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {activity.map((a) => (
            <div
              key={a.id}
              className="flex items-baseline justify-between gap-4 py-1 text-xs"
            >
              <p className="min-w-0 flex-1 text-muted-foreground">
                <span className="font-medium text-foreground">
                  {a.actorName ?? 'System'}
                </span>{' '}
                {ACTIVITY_LABELS[a.type] ?? a.type}
              </p>
              <time className="shrink-0 text-muted-foreground/70">
                {new Date(a.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeamSettingsPage() {
  const queryClient = useQueryClient();
  const teamQueries = useTeamSettingsQueries();
  const dashboardQ = teamQueries[0];
  const activityQ = teamQueries[1];

  const loaded = !dashboardQ.isPending;
  const data = dashboardQ.data;
  const activity = activityQ.data ?? [];

  const refreshTeam = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.team.root });
  };

  if (!loaded) {
    return <p className="text-sm text-muted-foreground">Loading team…</p>;
  }

  const team = data?.team;
  const members = data?.members ?? [];
  const invites = data?.invites ?? [];
  const incomingInvites = data?.incomingInvites ?? [];
  const currentUserId = data?.currentUserId ?? null;

  const currentMember = members.find((m) => m.userId === currentUserId);
  const isOwner = currentMember?.role === 'owner';
  const canManage = isOwner || currentMember?.role === 'admin';

  if (!team) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <p className="text-sm text-muted-foreground">
              No team found. Create one to get started.
            </p>
            <CreateTeamDialog onCreated={refreshTeam} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TeamDetailsCard
        team={team}
        canRename={canManage}
        canDelete={isOwner}
      />
      <IncomingInvitesCard invites={incomingInvites} />
      {canManage && <InviteSection />}
      <MembersCard
        members={members}
        invites={invites}
        currentUserId={currentUserId}
        isOwner={isOwner}
        canManage={canManage}
      />
      <div className="flex justify-end">
        <CreateTeamDialog onCreated={refreshTeam} />
      </div>
      <ActivityCard activity={activity} />
    </div>
  );
}
