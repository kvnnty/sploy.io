import type { TeamRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      teamMembership?: { teamId: string; role: TeamRole };
    }
  }
}

export {};
