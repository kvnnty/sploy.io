import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database';
import type { AuthUser } from '../auth';

interface BootstrapResult {
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

  constructor(private readonly db: DatabaseService) {}

  async bootstrap(
    authUser: AuthUser,
    opts: { displayName?: string; orgName?: string; orgSlug?: string },
  ): Promise<BootstrapResult> {
    let isNewUser = false;
    let isNewOrg = false;

    const { rows: existingUsers } = await this.db.query<{
      id: string;
    }>('SELECT id FROM core.users WHERE auth_user_id = $1', [
      authUser.authUserId,
    ]);

    let userId: string;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
    } else {
      const { rows } = await this.db.query<{ id: string }>(
        `INSERT INTO core.users (auth_user_id, email, display_name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [authUser.authUserId, authUser.email, opts.displayName ?? null],
      );
      userId = rows[0].id;
      isNewUser = true;
      this.logger.log(`Bootstrapped new user ${userId} for ${authUser.email}`);
    }

    const { rows: memberships } = await this.db.query<{
      org_id: string;
      slug: string;
      role: string;
    }>(
      `SELECT m.org_id, o.slug, m.role
       FROM core.memberships m
       JOIN core.organizations o ON o.id = m.org_id
       WHERE m.user_id = $1
       ORDER BY m.created_at ASC
       LIMIT 1`,
      [userId],
    );

    if (memberships.length > 0) {
      return {
        userId,
        email: authUser.email,
        orgId: memberships[0].org_id,
        orgSlug: memberships[0].slug,
        role: memberships[0].role,
        isNewUser,
        isNewOrg: false,
      };
    }

    // Auto-join by email domain
    const emailDomain = authUser.email.split('@')[1];
    const { rows: domainOrgs } = await this.db.query<{
      id: string;
      slug: string;
    }>('SELECT id, slug FROM core.organizations WHERE domain = $1 LIMIT 1', [
      emailDomain,
    ]);

    if (domainOrgs.length > 0) {
      await this.db.query(
        `INSERT INTO core.memberships (user_id, org_id, role)
         VALUES ($1, $2, 'member')
         ON CONFLICT (user_id, org_id) DO NOTHING`,
        [userId, domainOrgs[0].id],
      );
      return {
        userId,
        email: authUser.email,
        orgId: domainOrgs[0].id,
        orgSlug: domainOrgs[0].slug,
        role: 'member',
        isNewUser,
        isNewOrg: false,
      };
    }

    // Create a personal org if name/slug provided
    if (opts.orgName && opts.orgSlug) {
      const { rows: existing } = await this.db.query(
        'SELECT id FROM core.organizations WHERE slug = $1',
        [opts.orgSlug],
      );
      if (existing.length > 0) {
        throw new ConflictException(`Organization slug "${opts.orgSlug}" is taken`);
      }

      const { rows: newOrg } = await this.db.query<{ id: string }>(
        `INSERT INTO core.organizations (name, slug)
         VALUES ($1, $2)
         RETURNING id`,
        [opts.orgName, opts.orgSlug],
      );
      await this.db.query(
        `INSERT INTO core.memberships (user_id, org_id, role)
         VALUES ($1, $2, 'owner')`,
        [userId, newOrg[0].id],
      );
      isNewOrg = true;

      return {
        userId,
        email: authUser.email,
        orgId: newOrg[0].id,
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
    const { rows } = await this.db.query<{
      org_id: string;
      slug: string;
      role: string;
    }>(
      `SELECT m.org_id, o.slug, m.role
       FROM core.memberships m
       JOIN core.organizations o ON o.id = m.org_id
       WHERE m.user_id = $1 AND m.org_id = $2`,
      [userId, orgId],
    );

    if (rows.length === 0) {
      throw new ForbiddenException('Not a member of this organization');
    }

    return {
      orgId: rows[0].org_id,
      orgSlug: rows[0].slug,
      role: rows[0].role,
    };
  }

  async listOrgs(userId: string) {
    const { rows } = await this.db.query<{
      org_id: string;
      name: string;
      slug: string;
      role: string;
    }>(
      `SELECT m.org_id, o.name, o.slug, m.role
       FROM core.memberships m
       JOIN core.organizations o ON o.id = m.org_id
       WHERE m.user_id = $1
       ORDER BY o.name`,
      [userId],
    );
    return rows;
  }
}
