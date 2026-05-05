import { Injectable, Logger } from '@nestjs/common';
import { AuthEventType } from '@prisma/client';
import { PrismaService } from '../database';

type AuthEventTypeInput =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'magic_link_sent'
  | 'sso_initiated'
  | 'sso_completed'
  | 'user_bootstrapped'
  | 'team_created'
  | 'membership_changed'
  | 'session_revoked';

interface AuditLogParams {
  eventType: AuthEventTypeInput;
  userId?: string | null;
  teamId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.authEvent.create({
        data: {
          eventType: params.eventType as AuthEventType,
          userId: params.userId ?? null,
          teamId: params.teamId ?? null,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
          metadata: (params.metadata ?? {}) as object,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit event: ${error}`, {
        eventType: params.eventType,
      });
    }
  }
}
