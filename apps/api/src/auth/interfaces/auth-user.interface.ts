export interface AuthUser {
  authUserId: string;
  email: string;
  internalUserId?: string;
  activeOrgId?: string;
  role?: string;
}
