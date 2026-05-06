import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BootstrapService } from '../bootstrap/bootstrap.service';
import { PrismaService } from '../database';
import type { AuthUser } from './interfaces/auth-user.interface';
import { JwtService } from './jwt.service';

@Injectable()
export class UserResolutionService {
  private readonly logger = new Logger(UserResolutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bootstrapService: BootstrapService,
    private readonly jwtService: JwtService,
  ) {}

  async resolve(authUser: AuthUser): Promise<AuthUser> {
    let user = await this.prisma.user.findFirst({
      where: { authUserId: authUser.authUserId },
      include: {
        memberships: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!user) {
      const provisionUser = await this.jwtService.withEmailFromClerkIfMissing(
        authUser,
      );
      if (!provisionUser.email) {
        throw new UnauthorizedException(
          'Email is required to provision your account',
        );
      }

      try {
        await this.bootstrapService.bootstrap(provisionUser, {});
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          this.logger.debug(
            `Race while provisioning auth_user_id=${authUser.authUserId}; reloading user`,
          );
        } else {
          throw err;
        }
      }

      user = await this.prisma.user.findFirst({
        where: { authUserId: authUser.authUserId },
        include: {
          memberships: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!user) {
        this.logger.error(
          `Provisioning failed: no user row after bootstrap for auth_user_id=${authUser.authUserId}`,
        );
        throw new UnauthorizedException('Failed to provision user');
      }
    }

    if (!user.memberships.length) {
      return {
        ...authUser,
        email: authUser.email ?? user.email,
        internalUserId: user.id,
      };
    }

    const preferred = user.preferredTeamId
      ? user.memberships.find((m) => m.teamId === user.preferredTeamId)
      : undefined;
    const active = preferred ?? user.memberships[0];

    return {
      ...authUser,
      email: authUser.email ?? user.email,
      internalUserId: user.id,
      activeTeamId: active?.teamId ?? undefined,
      role: active?.role ?? undefined,
    };
  }
}
