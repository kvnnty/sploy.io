import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationRealtimeService } from './notification-realtime.service';
import { NotificationListener } from './notification.listener';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationRealtimeService, NotificationListener],
  exports: [NotificationsService, NotificationRealtimeService],
})
export class NotificationsModule {}
