import {
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { NotificationCategory } from '@prisma/client';
import { CurrentUser, type AuthUser } from '../auth';
import { RateLimitGuard, RateLimit } from '../auth/guards/rate-limit.guard';
import { NotificationsService } from './notifications.service';
import { NotificationRealtimeService } from './notification-realtime.service';
import {
  ListNotificationsDto,
  UpdatePreferenceDto,
} from './dto/notifications.dto';

@Controller('notifications')
@UseGuards(RateLimitGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: NotificationRealtimeService,
  ) {}

  @Get()
  @RateLimit({ windowMs: 60_000, maxRequests: 30 })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListNotificationsDto,
  ) {
    return this.notificationsService.list(this.requireUserId(user), query);
  }

  @Get('unread-count')
  @RateLimit({ windowMs: 60_000, maxRequests: 60 })
  async unreadCount(@CurrentUser() user: AuthUser) {
    const count = await this.notificationsService.unreadCount(
      this.requireUserId(user),
    );
    return { count };
  }

  @Patch(':id/read')
  @RateLimit({ windowMs: 60_000, maxRequests: 30 })
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.notificationsService.markRead(this.requireUserId(user), id);
    return { ok: true };
  }

  @Patch(':id/unread')
  @RateLimit({ windowMs: 60_000, maxRequests: 30 })
  async markUnread(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.notificationsService.markUnread(this.requireUserId(user), id);
    return { ok: true };
  }

  @Post('read-all')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async markAllRead(@CurrentUser() user: AuthUser) {
    await this.notificationsService.markAllRead(this.requireUserId(user));
    return { ok: true };
  }

  @Delete(':id')
  @RateLimit({ windowMs: 60_000, maxRequests: 20 })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.notificationsService.remove(this.requireUserId(user), id);
    return { ok: true };
  }

  @Get('preferences')
  @RateLimit({ windowMs: 60_000, maxRequests: 20 })
  async getPreferences(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getPreferences(this.requireUserId(user));
  }

  @Patch('preferences')
  @RateLimit({ windowMs: 60_000, maxRequests: 20 })
  async updatePreference(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.notificationsService.updatePreference(
      this.requireUserId(user),
      dto.category as NotificationCategory,
      {
        inAppEnabled: dto.inAppEnabled,
        emailEnabled: dto.emailEnabled,
      },
    );
  }

  @Sse('stream')
  stream(@CurrentUser() user: AuthUser): Observable<MessageEvent> {
    const userId = this.requireUserId(user);
    return this.realtimeService.subscribe(userId).pipe(
      map(
        (event) =>
          ({
            data: JSON.stringify(event),
          }) as MessageEvent,
      ),
    );
  }

  private requireUserId(user: AuthUser): string {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return user.internalUserId;
  }
}
