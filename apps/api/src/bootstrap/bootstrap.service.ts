import {
  Injectable,
  Logger,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import type { AuthUser } from '../auth';
import { PrismaService } from '../database';

export interface BootstrapResult {
  userId: string;
  email: string;
  orgId: string | null;
  orgSlug: string | null;
  role: string | null;
  isNewUser: boolean;
  isNewOrg: boolean;
}

@Injectable()
export class BootstrapService {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async bootstrap(
    authUser: AuthUser,
    opts: { displayName?: string; orgName?: string; orgSlug?: string },
  ): Promise<BootstrapResult> {
    let isNewUser = false;
    let isNewOrg = false;

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
      include: { org: true },
    });

    if (membership) {
      return {
        userId,
        email: authUser.email,
        orgId: membership.orgId,
        orgSlug: membership.org.slug,
        role: membership.role,
        isNewUser,
        isNewOrg: false,
      };
    }

    const emailDomain = authUser.email.split('@')[1];
    const domainOrg = emailDomain
      ? await this.prisma.organization.findFirst({
          where: { domain: emailDomain },
        })
      : null;

    if (domainOrg) {
      await this.prisma.membership.createMany({
        data: [{ userId, orgId: domainOrg.id, role: OrgRole.member }],
        skipDuplicates: true,
      });
      return {
        userId,
        email: authUser.email,
        orgId: domainOrg.id,
        orgSlug: domainOrg.slug,
        role: 'member',
        isNewUser,
        isNewOrg: false,
      };
    }

    if (opts.orgName && opts.orgSlug) {
      const slugTaken = await this.prisma.organization.findFirst({
        where: { slug: opts.orgSlug },
        select: { id: true },
      });
      if (slugTaken) {
        throw new ConflictException(
          `Organization slug "${opts.orgSlug}" is taken`,
        );
      }

      const newOrg = await this.prisma.organization.create({
        data: {
          name: opts.orgName,
          slug: opts.orgSlug,
          memberships: {
            create: { userId, role: OrgRole.owner },
          },
        },
      });
      isNewOrg = true;

      return {
        userId,
        email: authUser.email,
        orgId: newOrg.id,
        orgSlug: opts.orgSlug,
        role: 'owner',
        isNewUser,
        isNewOrg,
      };
    }

    return {
      userId,
      email: authUser.email,
      orgId: null,
      orgSlug: null,
      role: null,
      isNewUser,
      isNewOrg,
    };
  }

  async switchOrg(
    userId: string,
    orgId: string,
  ): Promise<{ orgId: string; orgSlug: string; role: string }> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, orgId },
      include: { org: true },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    return {
      orgId: membership.orgId,
      orgSlug: membership.org.slug,
      role: membership.role,
    };
  }

  async listOrgs(userId: string) {
    const rows = await this.prisma.membership.findMany({
      where: { userId },
      include: { org: true },
      orderBy: { org: { name: 'asc' } },
    });
    return rows.map((m) => ({
      org_id: m.orgId,
      name: m.org.name,
      slug: m.org.slug,
      role: m.role,
    }));
  }
}
