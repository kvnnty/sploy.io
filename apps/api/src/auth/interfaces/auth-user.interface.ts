export interface AuthUser {
  authUserId: string;
  email?: string;
  sessionId?: string;
  internalUserId?: string;
  activeTeamId?: string;
  role?: string;
}
