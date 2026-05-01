import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database';

interface SsoConnection {
  id: string;
  org_id: string;
  provider: string;
  domain: string;
  metadata_url: string | null;
  enabled: boolean;
  created_at: string;
}

@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name);

  constructor(private readonly db: DatabaseService) {}

  async discover(domain: string): Promise<{ orgSlug: string; enabled: boolean } | null> {
    const { rows } = await this.db.query<{
      slug: string;
      enabled: boolean;
    }>(
      `SELECT o.slug, sc.enabled
       FROM core.sso_connections sc
       JOIN core.organizations o ON o.id = sc.org_id
       WHERE sc.domain = $1
       LIMIT 1`,
      [domain.toLowerCase()],
    );

    if (rows.length === 0) return null;
    return { orgSlug: rows[0].slug, enabled: rows[0].enabled };
  }

  async createConnection(
    userId: string,
    data: {
      orgId: string;
      domain: string;
      metadataUrl?: string;
      metadataXml?: string;
      attributeMapping?: Record<string, string>;
    },
  ): Promise<SsoConnection> {
    const { rows: membership } = await this.db.query<{ role: string }>(
      `SELECT role FROM core.memberships WHERE user_id = $1 AND org_id = $2`,
      [userId, data.orgId],
    );
    if (membership.length === 0 || !['owner', 'admin'].includes(membership[0].role)) {
      throw new ForbiddenException('Only owners/admins can manage SSO');
    }

    const { rows: existing } = await this.db.query(
      'SELECT id FROM core.sso_connections WHERE domain = $1',
      [data.domain.toLowerCase()],
    );
    if (existing.length > 0) {
      throw new ConflictException(`SSO connection for domain "${data.domain}" already exists`);
    }

    const { rows } = await this.db.query<SsoConnection>(
      `INSERT INTO core.sso_connections (org_id, domain, metadata_url, metadata_xml, attribute_mapping)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.orgId,
        data.domain.toLowerCase(),
        data.metadataUrl ?? null,
        data.metadataXml ?? null,
        JSON.stringify(data.attributeMapping ?? {}),
      ],
    );

    this.logger.log(`SSO connection created for domain=${data.domain} org=${data.orgId}`);
    return rows[0];
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
    const { rows: conn } = await this.db.query<{ org_id: string }>(
      'SELECT org_id FROM core.sso_connections WHERE id = $1',
      [connectionId],
    );
    if (conn.length === 0) throw new NotFoundException('SSO connection not found');

    const { rows: membership } = await this.db.query<{ role: string }>(
      `SELECT role FROM core.memberships WHERE user_id = $1 AND org_id = $2`,
      [userId, conn[0].org_id],
    );
    if (membership.length === 0 || !['owner', 'admin'].includes(membership[0].role)) {
      throw new ForbiddenException('Only owners/admins can manage SSO');
    }

    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.metadataUrl !== undefined) {
      sets.push(`metadata_url = $${idx++}`);
      params.push(data.metadataUrl);
    }
    if (data.metadataXml !== undefined) {
      sets.push(`metadata_xml = $${idx++}`);
      params.push(data.metadataXml);
    }
    if (data.attributeMapping !== undefined) {
      sets.push(`attribute_mapping = $${idx++}`);
      params.push(JSON.stringify(data.attributeMapping));
    }
    if (data.enabled !== undefined) {
      sets.push(`enabled = $${idx++}`);
      params.push(data.enabled);
    }

    if (sets.length === 0) {
      const { rows } = await this.db.query<SsoConnection>(
        'SELECT * FROM core.sso_connections WHERE id = $1',
        [connectionId],
      );
      return rows[0];
    }

    params.push(connectionId);
    const { rows } = await this.db.query<SsoConnection>(
      `UPDATE core.sso_connections SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
    return rows[0];
  }

  async listConnections(orgId: string): Promise<SsoConnection[]> {
    const { rows } = await this.db.query<SsoConnection>(
      'SELECT * FROM core.sso_connections WHERE org_id = $1 ORDER BY created_at',
      [orgId],
    );
    return rows;
  }

  async deleteConnection(userId: string, connectionId: string): Promise<void> {
    const { rows: conn } = await this.db.query<{ org_id: string }>(
      'SELECT org_id FROM core.sso_connections WHERE id = $1',
      [connectionId],
    );
    if (conn.length === 0) throw new NotFoundException('SSO connection not found');

    const { rows: membership } = await this.db.query<{ role: string }>(
      `SELECT role FROM core.memberships WHERE user_id = $1 AND org_id = $2`,
      [userId, conn[0].org_id],
    );
    if (membership.length === 0 || !['owner', 'admin'].includes(membership[0].role)) {
      throw new ForbiddenException('Only owners/admins can manage SSO');
    }

    await this.db.query('DELETE FROM core.sso_connections WHERE id = $1', [connectionId]);
    this.logger.log(`SSO connection ${connectionId} deleted`);
  }
}
