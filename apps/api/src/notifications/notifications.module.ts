import { Module } from '@nestjs/common';

import { MailModule } from '../mail';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationRealtimeService } from './notification-realtime.service';
import { NotificationListener } from './notification.listener';
import { NotificationEmailService } from './notification-email.service';

@Module({
  imports: [MailModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationRealtimeService,
    NotificationListener,
    NotificationEmailService,
  ],
  exports: [NotificationsService, NotificationRealtimeService],
})
export class NotificationsModule {}
