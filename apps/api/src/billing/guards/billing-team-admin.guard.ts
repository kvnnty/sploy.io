import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TeamRole } from '@prisma/client';
import { PrismaService } from '../../database';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

/**
 * Requires `teamId` on body (POST) or query (GET) and owner/admin membership.
 */
@Injectable()
export class BillingTeamAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      body?: { teamId?: string };
      query?: { teamId?: string };
    }>();
    const user = request.user;
    if (!user?.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    const teamId = request.body?.teamId ?? request.query?.teamId;
    if (!teamId || typeof teamId !== 'string') {
      throw new BadRequestException('teamId is required');
    }

    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.internalUserId, teamId },
    });
    if (!membership) {
      throw new ForbiddenException('Not a member of this team');
    }
    if (
      membership.role !== TeamRole.owner &&
      membership.role !== TeamRole.admin
    ) {
      throw new ForbiddenException('Owner or admin role required for billing');
    }
    return true;
  }
}
