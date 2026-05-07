export type AuthMeResponse = {
  authUserId: string;
  email: string;
  internalUserId: string | null;
  activeTeamId?: string | null;
  role?: string | null;
};

export type TeamMembership = {
  team_id: string;
  name: string;
  slug: string;
  role: string;
  logoUrl?: string | null;
};

export type ProviderStatus = {
  provider: string;
  connected: boolean;
  email: string | null;
};

export type BootstrapPayload = {
  displayName: string;
  teamName: string;
  teamSlug: string;
};
