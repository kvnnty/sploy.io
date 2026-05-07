import { Injectable } from '@nestjs/common';
import { NotificationCategory } from '@prisma/client';
import { readFileSync } from 'fs';
import Handlebars from 'handlebars';

import { PrismaService } from '../database';
import { MailService, resolveMailTemplatePath } from '../mail';

type EmailNotificationInput = {
  userId: string;
  category: NotificationCategory;
  title: string;
  body?: string | null;
  actionUrl?: string | null;
};

@Injectable()
export class NotificationEmailService {
  private readonly template: Handlebars.TemplateDelegate<{
    appName: string;
    title: string;
    body: string;
    actionUrl?: string;
    categoryLabel: string;
  }>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    const templatePath = resolveMailTemplatePath(
      'notifications',
      'notification-email.hbs',
    );
    const source = readFileSync(templatePath, 'utf-8');
    this.template = Handlebars.compile(source);
  }

  async sendIfEnabled(input: EmailNotificationInput): Promise<void> {
    if (!this.mail.isConfigured()) return;

    const [preference, user] = await Promise.all([
      this.prisma.notificationPreference.findUnique({
        where: {
          userId_category: {
            userId: input.userId,
            category: input.category,
          },
        },
        select: { emailEnabled: true },
      }),
      this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      }),
    ]);

    if (!user?.email) return;
    if (preference && !preference.emailEnabled) return;

    const appName = this.mail.getAppName();
    const actionUrl = input.actionUrl
      ? this.mail.toAbsoluteUrl(input.actionUrl)
      : undefined;

    const html = this.template({
      appName,
      title: input.title,
      body: input.body ?? 'You have a new notification in your account.',
      actionUrl,
      categoryLabel: this.categoryLabel(input.category),
    });

    await this.mail.sendHtml({
      to: user.email,
      subject: `[${appName}] ${input.title}`,
      html,
    });
  }

  private categoryLabel(category: NotificationCategory): string {
    switch (category) {
      case NotificationCategory.account_security:
        return 'Account & Security';
      case NotificationCategory.team_collaboration:
        return 'Team & Collaboration';
      case NotificationCategory.system_product:
        return 'System & Product';
      default:
        return 'Notification';
    }
  }
}
