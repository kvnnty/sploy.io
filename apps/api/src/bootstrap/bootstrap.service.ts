import {
  Injectable,
  Logger,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { TeamRole } from '@prisma/client';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { PrismaService } from '../database';

export interface BootstrapResult {
  userId: string;
  email: string;
  teamId: string | null;
  teamSlug: string | null;
  role: string | null;
  isNewUser: boolean;
  isNewTeam: boolean;
}

@Injectable()
export class BootstrapService {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  private toSlug(value: string): string {
    const base = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    return base || 'team';
  }

  private async buildUniqueTeamSlug(seed: string): Promise<string> {
    const base = this.toSlug(seed);
    for (let i = 0; i < 50; i += 1) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;
      const exists = await this.prisma.team.findFirst({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  async bootstrap(
    authUser: AuthUser,
    opts: { displayName?: string; teamName?: string; teamSlug?: string },
  ): Promise<BootstrapResult> {
    if (!authUser.email) {
      throw new ForbiddenException('Email claim is required for bootstrap');
    }

    let isNewUser = false;
    let isNewTeam = false;

    let user = await this.prisma.user.findFirst({
      where: { authUserId: authUser.authUserId },
    });

    let userId: string;

    if (user) {
      userId = user.id;
    } else {
      user = await this.prisma.user.create({
        data: {
          authUserId: authUser.authUserId,
          email: authUser.email,
          displayName: opts.displayName ?? null,
        },
      });
      userId = user.id;
      isNewUser = true;
      this.logger.log(`Bootstrapped new user ${userId} for ${authUser.email}`);
    }

    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { team: true },
    });

    if (membership) {
      return {
        userId,
        email: authUser.email,
        teamId: membership.teamId,
        teamSlug: membership.team.slug,
        role: membership.role,
        isNewUser,
        isNewTeam: false,
      };
    }

    const emailDomain = authUser.email.split('@')[1];
    const domainTeam = emailDomain
      ? await this.prisma.team.findFirst({
          where: { domain: emailDomain },
        })
      : null;

    if (domainTeam) {
      await this.prisma.membership.createMany({
        data: [{ userId, teamId: domainTeam.id, role: TeamRole.member }],
        skipDuplicates: true,
      });
      return {
        userId,
        email: authUser.email,
        teamId: domainTeam.id,
        teamSlug: domainTeam.slug,
        role: 'member',
        isNewUser,
        isNewTeam: false,
      };
    }

    if (opts.teamName && opts.teamSlug) {
      const slugTaken = await this.prisma.team.findFirst({
        where: { slug: opts.teamSlug },
        select: { id: true },
      });
      if (slugTaken) {
        throw new ConflictException(
          `Team slug "${opts.teamSlug}" is taken`,
        );
      }

      const newTeam = await this.prisma.team.create({
        data: {
          name: opts.teamName,
          slug: opts.teamSlug,
          memberships: {
            create: { userId, role: TeamRole.owner },
          },
        },
      });
      isNewTeam = true;

      return {
        userId,
        email: authUser.email,
        teamId: newTeam.id,
        teamSlug: opts.teamSlug,
        role: 'owner',
        isNewUser,
        isNewTeam,
      };
    }

    const displayBase =
      opts.displayName?.trim() ||
      user?.displayName?.trim() ||
      authUser.email.split('@')[0].trim() ||
      'User';
    const defaultTeamName = `${displayBase}'s Team`;
    const defaultTeamSlug = await this.buildUniqueTeamSlug(defaultTeamName);

    const personalTeam = await this.prisma.team.create({
      data: {
        name: defaultTeamName,
        slug: defaultTeamSlug,
        memberships: {
          create: { userId, role: TeamRole.owner },
        },
      },
    });
    isNewTeam = true;

    return {
      userId,
      email: authUser.email,
      teamId: personalTeam.id,
      teamSlug: personalTeam.slug,
      role: TeamRole.owner,
      isNewUser,
      isNewTeam,
    };
  }

  async switchTeam(
    userId: string,
    teamId: string,
  ): Promise<{ teamId: string; teamSlug: string; role: string }> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, teamId },
      include: { team: true },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this team');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { preferredTeamId: teamId },
    });

    return {
      teamId: membership.teamId,
      teamSlug: membership.team.slug,
      role: membership.role,
    };
  }

  async listTeams(userId: string) {
    const rows = await this.prisma.membership.findMany({
      where: { userId },
      include: { team: true },
      orderBy: { team: { name: 'asc' } },
    });
    return rows.map((m) => ({
      team_id: m.teamId,
      name: m.team.name,
      slug: m.team.slug,
      role: m.role,
      logoUrl: m.team.logoUrl,
    }));
  }
}
