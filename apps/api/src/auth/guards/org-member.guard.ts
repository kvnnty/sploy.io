import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { OrgRole } from '../../generated/prisma/client';
import { PrismaService } from '../../database';
import type { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params: { orgId?: string };
      orgMembership?: { orgId: string; role: OrgRole };
    }>();
    const user = request.user;
    const orgId = request.params.orgId;

    if (!user?.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    if (!orgId) {
      throw new ForbiddenException('Missing organization');
    }

    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.internalUserId, orgId },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    request.orgMembership = { orgId, role: membership.role };
    return true;
  }
}
