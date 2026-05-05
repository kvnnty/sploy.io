import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationCategory } from '@prisma/client';
import { PrismaService } from '../database';
import { NotificationsService } from './notifications.service';
import { NotificationRealtimeService } from './notification-realtime.service';
import {
  NOTIFICATION_EVENTS,
  type NewSessionEvent,
  type TeamInviteEvent,
  type InviteAcceptedEvent,
  type RoleChangedEvent,
  type MemberRemovedEvent,
} from './events';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly realtime: NotificationRealtimeService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(NOTIFICATION_EVENTS.NEW_SESSION, { async: true })
  async handleNewSession(event: NewSessionEvent) {
    try {
      const device = this.parseDevice(event.userAgent);
      const notification = await this.notifications.createIfEnabled({
        userId: event.userId,
        category: NotificationCategory.account_security,
        type: 'new_device_login',
        title: 'New sign-in detected',
        body: `A new session was started from ${device}`,
        actionUrl: '/dashboard/settings/security',
        idempotencyKey: `new_session:${event.authSessionId}`,
        metadata: {
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          device,
        },
      });
      if (notification) {
        await this.pushToUser(event.userId);
      }
    } catch (err) {
      this.logger.error(`Failed to handle new session event: ${err}`);
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.TEAM_INVITE, { async: true })
  async handleTeamInvite(event: TeamInviteEvent) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: event.inviteeEmail },
        select: { id: true },
      });
      if (!user) return;

      const notification = await this.notifications.createIfEnabled({
        userId: user.id,
        category: NotificationCategory.team_collaboration,
        type: 'team_invite',
        title: 'Team invitation',
        body: `${event.inviterName ?? 'Someone'} invited you to join ${event.teamName}`,
        actionUrl: '/dashboard/settings/team',
        idempotencyKey: `invite:${event.invitationId}`,
        metadata: { teamId: event.teamId, teamName: event.teamName },
      });
      if (notification) {
        await this.pushToUser(user.id);
      }
    } catch (err) {
      this.logger.error(`Failed to handle team invite event: ${err}`);
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.INVITE_ACCEPTED, { async: true })
  async handleInviteAccepted(event: InviteAcceptedEvent) {
    try {
      const notification = await this.notifications.createIfEnabled({
        userId: event.userId,
        category: NotificationCategory.team_collaboration,
        type: 'invite_accepted',
        title: 'Invite accepted',
        body: `${event.accepterName ?? 'A user'} accepted your invitation to ${event.teamName}`,
        actionUrl: '/dashboard/settings/team',
        idempotencyKey: `invite_accepted:${event.invitationId}`,
        metadata: { teamId: event.teamId, teamName: event.teamName },
      });
      if (notification) {
        await this.pushToUser(event.userId);
      }
    } catch (err) {
      this.logger.error(`Failed to handle invite accepted event: ${err}`);
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.ROLE_CHANGED, { async: true })
  async handleRoleChanged(event: RoleChangedEvent) {
    try {
      const notification = await this.notifications.createIfEnabled({
        userId: event.targetUserId,
        category: NotificationCategory.team_collaboration,
        type: 'role_changed',
        title: 'Role updated',
        body: `Your role in ${event.teamName} was changed to ${event.newRole}${event.actorName ? ` by ${event.actorName}` : ''}`,
        actionUrl: '/dashboard/settings/team',
        idempotencyKey: `role:${event.memberId}:${event.newRole}`,
        metadata: { newRole: event.newRole, teamName: event.teamName },
      });
      if (notification) {
        await this.pushToUser(event.targetUserId);
      }
    } catch (err) {
      this.logger.error(`Failed to handle role changed event: ${err}`);
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.MEMBER_REMOVED, { async: true })
  async handleMemberRemoved(event: MemberRemovedEvent) {
    try {
      const notification = await this.notifications.createIfEnabled({
        userId: event.targetUserId,
        category: NotificationCategory.team_collaboration,
        type: 'member_removed',
        title: 'Removed from team',
        body: `You were removed from ${event.teamName}${event.actorName ? ` by ${event.actorName}` : ''}`,
        idempotencyKey: `removed:${event.memberId}:${event.teamId}`,
        metadata: { teamId: event.teamId, teamName: event.teamName },
      });
      if (notification) {
        await this.pushToUser(event.targetUserId);
      }
    } catch (err) {
      this.logger.error(`Failed to handle member removed event: ${err}`);
    }
  }

  private async pushToUser(userId: string) {
    const count = await this.notifications.unreadCount(userId);
    this.realtime.emit(userId, { type: 'unread_count', payload: { count } });
  }

  private parseDevice(userAgent: string | null): string {
    if (!userAgent) return 'an unknown device';
    const ua = userAgent.toLowerCase();
    let browser = 'a browser';
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edg')) browser = 'Edge';

    let os = '';
    if (ua.includes('windows')) os = ' on Windows';
    else if (ua.includes('mac')) os = ' on macOS';
    else if (ua.includes('linux')) os = ' on Linux';
    else if (ua.includes('android')) os = ' on Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = ' on iOS';

    return `${browser}${os}`;
  }
}
