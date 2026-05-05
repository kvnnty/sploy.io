import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { TeamRole } from '@prisma/client';
import { PrismaService } from '../../database';
import type { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class TeamMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params: { teamId?: string };
      teamMembership?: { teamId: string; role: TeamRole };
    }>();
    const user = request.user;
    const teamId = request.params.teamId;

    if (!user?.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    if (!teamId) {
      throw new ForbiddenException('Missing team');
    }

    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.internalUserId, teamId },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this team');
    }

    request.teamMembership = { teamId, role: membership.role };
    return true;
  }
}
