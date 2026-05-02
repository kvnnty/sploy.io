import type { OrgRole } from '../generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      orgMembership?: { orgId: string; role: OrgRole };
    }
  }
}

export {};
