import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../database';

export interface CreateNotificationInput {
  userId: string;
  category: NotificationCategory;
  type: string;
  title: string;
  body?: string;
  actionUrl?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

const DEFAULT_LIMIT = 15;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    if (input.idempotencyKey) {
      const existing = await this.prisma.notification.findUnique({
        where: {
          userId_idempotencyKey: {
            userId: input.userId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (existing) return existing;
    }

    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        category: input.category,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        actionUrl: input.actionUrl ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Checks user preferences before creating. Returns the notification if
   * created, or null if in-app notifications are disabled for this category.
   */
  async createIfEnabled(input: CreateNotificationInput) {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_category: {
          userId: input.userId,
          category: input.category,
        },
      },
    });

    if (pref && !pref.inAppEnabled) {
      this.logger.debug(
        `In-app notifications disabled for user=${input.userId} category=${input.category}`,
      );
      return null;
    }

    return this.create(input);
  }

  async list(
    userId: string,
    opts: {
      cursor?: string;
      limit?: number;
      unreadOnly?: boolean;
      category?: string;
      type?: string;
    } = {},
  ) {
    const take = Math.min(opts.limit ?? DEFAULT_LIMIT, 50);

    const where: Prisma.NotificationWhereInput = { userId };
    if (opts.unreadOnly) where.readAt = null;
    if (opts.category)
      where.category = opts.category as NotificationCategory;
    if (opts.type) where.type = opts.type;

    const findArgs: Prisma.NotificationFindManyArgs = {
      where,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
    };
    if (opts.cursor) {
      findArgs.cursor = { id: opts.cursor };
      findArgs.skip = 1;
    }

    const items = await this.prisma.notification.findMany(findArgs);
    const hasMore = items.length > take;
    if (hasMore) items.pop();

    return {
      items: items.map((n) => ({
        id: n.id,
        category: n.category,
        type: n.type,
        title: n.title,
        body: n.body,
        actionUrl: n.actionUrl,
        read: n.readAt !== null,
        metadata: n.metadata,
        createdAt: n.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.findOwned(userId, notificationId);
    if (notification.readAt) return;
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markUnread(userId: string, notificationId: string) {
    await this.findOwned(userId, notificationId);
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: null },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async remove(userId: string, notificationId: string) {
    await this.findOwned(userId, notificationId);
    await this.prisma.notification.delete({ where: { id: notificationId } });
  }

  async getPreferences(userId: string) {
    const prefs = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });

    const categories = Object.values(NotificationCategory);
    return categories.map((cat) => {
      const existing = prefs.find((p) => p.category === cat);
      return {
        category: cat,
        inAppEnabled: existing?.inAppEnabled ?? true,
        emailEnabled: existing?.emailEnabled ?? false,
      };
    });
  }

  async updatePreference(
    userId: string,
    category: NotificationCategory,
    data: { inAppEnabled?: boolean; emailEnabled?: boolean },
  ) {
    const pref = await this.prisma.notificationPreference.upsert({
      where: { userId_category: { userId, category } },
      update: {
        ...(data.inAppEnabled !== undefined && {
          inAppEnabled: data.inAppEnabled,
        }),
        ...(data.emailEnabled !== undefined && {
          emailEnabled: data.emailEnabled,
        }),
      },
      create: {
        userId,
        category,
        inAppEnabled: data.inAppEnabled ?? true,
        emailEnabled: data.emailEnabled ?? false,
      },
    });

    return {
      category: pref.category,
      inAppEnabled: pref.inAppEnabled,
      emailEnabled: pref.emailEnabled,
    };
  }

  private async findOwned(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) {
      throw new ForbiddenException('Notification not found');
    }
    return notification;
  }
}
