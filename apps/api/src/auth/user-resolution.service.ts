import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database';
import type { AuthUser } from './interfaces/auth-user.interface';

@Injectable()
export class UserResolutionService {
  private readonly logger = new Logger(UserResolutionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resolve(authUser: AuthUser): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      where: { authUserId: authUser.authUserId },
      include: {
        memberships: { take: 1, orderBy: { createdAt: 'asc' } },
      },
    });

    if (!user) {
      this.logger.debug(
        `No internal user found for auth_user_id=${authUser.authUserId}, returning unresolved`,
      );
      return authUser;
    }

    const m = user.memberships[0];
    return {
      ...authUser,
      internalUserId: user.id,
      activeTeamId: m?.teamId ?? undefined,
      role: m?.role ?? undefined,
    };
  }
}
