export const NOTIFICATION_EVENTS = {
  NEW_SESSION: 'notification.new_session',
  TEAM_INVITE: 'notification.team_invite',
  INVITE_ACCEPTED: 'notification.invite_accepted',
  INVITE_DECLINED: 'notification.invite_declined',
  ROLE_CHANGED: 'notification.role_changed',
  MEMBER_REMOVED: 'notification.member_removed',
} as const;

export interface NewSessionEvent {
  userId: string;
  authSessionId: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface TeamInviteEvent {
  inviteeEmail: string;
  teamId: string;
  teamName: string;
  invitationId: string;
  inviterName: string | null;
}

export interface InviteAcceptedEvent {
  userId: string;
  teamId: string;
  teamName: string;
  invitationId: string;
  accepterName: string | null;
}

export interface InviteDeclinedEvent {
  userId: string;
  teamId: string;
  invitationId: string;
  declinerEmail: string;
  declinerName: string | null;
}

export interface RoleChangedEvent {
  targetUserId: string;
  memberId: string;
  newRole: string;
  teamName: string;
  actorName: string | null;
}

export interface MemberRemovedEvent {
  targetUserId: string;
  memberId: string;
  teamId: string;
  teamName: string;
  actorName: string | null;
}
