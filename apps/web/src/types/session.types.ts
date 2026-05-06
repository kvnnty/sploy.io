export type SessionInfo = {
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
