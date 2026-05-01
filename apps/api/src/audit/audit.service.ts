import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database';

type AuthEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'magic_link_sent'
  | 'sso_initiated'
  | 'sso_completed'
  | 'user_bootstrapped'
  | 'org_created'
  | 'membership_changed'
  | 'session_revoked';

interface AuditLogParams {
  eventType: AuthEventType;
  userId?: string | null;
  orgId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly db: DatabaseService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO audit.auth_events (event_type, user_id, org_id, ip_address, user_agent, metadata)
         VALUES ($1, $2, $3, $4::inet, $5, $6)`,
        [
          params.eventType,
          params.userId ?? null,
          params.orgId ?? null,
          params.ipAddress ?? null,
          params.userAgent ?? null,
          JSON.stringify(params.metadata ?? {}),
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to write audit event: ${error}`, {
        eventType: params.eventType,
      });
    }
  }
}
