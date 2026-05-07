export type TeamInfo = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
};

export type TeamMemberInfo = {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: 'owner' | 'admin' | 'member';
};

export type TeamInviteInfo = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export type IncomingTeamInvite = {
  id: string;
  teamId: string;
  teamName: string;
  role: string;
  createdAt: string;
};

export type TeamActivityEntry = {
  id: string;
  type: string;
  actorName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type TeamDashboardResponse = {
  team: TeamInfo;
  members: TeamMemberInfo[];
  invites: TeamInviteInfo[];
  incomingInvites?: IncomingTeamInvite[];
  currentUserId: string;
};

export type CreateTeamBody = { name: string; logoUrl?: string };

export type TeamCreated = { id: string; name: string; slug: string };
