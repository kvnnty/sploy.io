import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  TeamRole,
  type SsoConnection as SsoConnectionRow,
} from '@prisma/client';
import { PrismaService } from '../database';

export interface SsoConnection {
  id: string;
  team_id: string;
  provider: string;
  domain: string;
  metadata_url: string | null;
  enabled: boolean;
  created_at: string;
}

function toApiConnection(row: SsoConnectionRow): SsoConnection {
  return {
    id: row.id,
    team_id: row.teamId,
    provider: row.provider,
    domain: row.domain,
    metadata_url: row.metadataUrl,
    enabled: row.enabled,
    created_at: row.createdAt.toISOString(),
  };
}

function isAdminRole(role: TeamRole): boolean {
  return role === TeamRole.owner || role === TeamRole.admin;
}

@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async discover(
    domain: string,
  ): Promise<{ teamSlug: string; enabled: boolean } | null> {
    const conn = await this.prisma.ssoConnection.findFirst({
      where: { domain: domain.toLowerCase() },
      include: { team: true },
    });

    if (!conn) return null;
    return { teamSlug: conn.team.slug, enabled: conn.enabled };
  }

  async createConnection(
    userId: string,
    data: {
      teamId: string;
      domain: string;
      metadataUrl?: string;
      metadataXml?: string;
      attributeMapping?: Record<string, string>;
    },
  ): Promise<SsoConnection> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, teamId: data.teamId },
    });
    if (!membership || !isAdminRole(membership.role)) {
      throw new ForbiddenException('Only owners/admins can manage SSO');
    }

    const existing = await this.prisma.ssoConnection.findFirst({
      where: { domain: data.domain.toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        `SSO connection for domain "${data.domain}" already exists`,
      );
    }

    const row = await this.prisma.ssoConnection.create({
      data: {
        teamId: data.teamId,
        domain: data.domain.toLowerCase(),
        metadataUrl: data.metadataUrl ?? null,
        metadataXml: data.metadataXml ?? null,
        attributeMapping: (data.attributeMapping ?? {}) as object,
      },
    });

    this.logger.log(
      `SSO connection created for domain=${data.domain} team=${data.teamId}`,
    );
    return toApiConnection(row);
  }

  async updateConnection(
    userId: string,
    connectionId: string,
    data: {
      metadataUrl?: string;
      metadataXml?: string;
      attributeMapping?: Record<string, string>;
      enabled?: boolean;
    },
  ): Promise<SsoConnection> {
    const conn = await this.prisma.ssoConnection.findFirst({
      where: { id: connectionId },
      select: { teamId: true },
    });
    if (!conn) throw new NotFoundException('SSO connection not found');

    const membership = await this.prisma.membership.findFirst({
      where: { userId, teamId: conn.teamId },
    });
    if (!membership || !isAdminRole(membership.role)) {
      throw new ForbiddenException('Only owners/admins can manage SSO');
    }

    if (
      data.metadataUrl === undefined &&
      data.metadataXml === undefined &&
      data.attributeMapping === undefined &&
      data.enabled === undefined
    ) {
      const row = await this.prisma.ssoConnection.findUniqueOrThrow({
        where: { id: connectionId },
      });
      return toApiConnection(row);
    }

    const row = await this.prisma.ssoConnection.update({
      where: { id: connectionId },
      data: {
        ...(data.metadataUrl !== undefined && {
          metadataUrl: data.metadataUrl,
        }),
        ...(data.metadataXml !== undefined && {
          metadataXml: data.metadataXml,
        }),
        ...(data.attributeMapping !== undefined && {
          attributeMapping: data.attributeMapping as object,
        }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
    });
    return toApiConnection(row);
  }

  async listConnections(teamId: string): Promise<SsoConnection[]> {
    const rows = await this.prisma.ssoConnection.findMany({
      where: { teamId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toApiConnection);
  }

  async deleteConnection(userId: string, connectionId: string): Promise<void> {
    const conn = await this.prisma.ssoConnection.findFirst({
      where: { id: connectionId },
      select: { teamId: true },
    });
    if (!conn) throw new NotFoundException('SSO connection not found');

    const membership = await this.prisma.membership.findFirst({
      where: { userId, teamId: conn.teamId },
    });
    if (!membership || !isAdminRole(membership.role)) {
      throw new ForbiddenException('Only owners/admins can manage SSO');
    }

    await this.prisma.ssoConnection.delete({ where: { id: connectionId } });
    this.logger.log(`SSO connection ${connectionId} deleted`);
  }
}
