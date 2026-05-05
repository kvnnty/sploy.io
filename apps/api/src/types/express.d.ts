import type { OrgRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      orgMembership?: { orgId: string; role: OrgRole };
    }
  }
}

export {};
