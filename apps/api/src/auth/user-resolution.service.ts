import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database';
import type { AuthUser } from './interfaces/auth-user.interface';

@Injectable()
export class UserResolutionService {
  private readonly logger = new Logger(UserResolutionService.name);

  constructor(private readonly db: DatabaseService) {}

  async resolve(authUser: AuthUser): Promise<AuthUser> {
    const { rows } = await this.db.query<{
      id: string;
      org_id: string | null;
      role: string | null;
    }>(
      `SELECT u.id, m.org_id, m.role
       FROM core.users u
       LEFT JOIN core.memberships m ON m.user_id = u.id
       WHERE u.auth_user_id = $1
       LIMIT 1`,
      [authUser.authUserId],
    );

    if (rows.length > 0) {
      return {
        ...authUser,
        internalUserId: rows[0].id,
        activeOrgId: rows[0].org_id ?? undefined,
        role: rows[0].role ?? undefined,
      };
    }

    this.logger.debug(
      `No internal user found for auth_user_id=${authUser.authUserId}, returning unresolved`,
    );
    return authUser;
  }
}
