import {
  Controller,
  Delete,
  Get,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth';
import { RateLimitGuard, RateLimit } from '../auth/guards/rate-limit.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(RateLimitGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @RateLimit({ windowMs: 60_000, maxRequests: 20 })
  async listSessions(@CurrentUser() user: AuthUser) {
    if (!user.authUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.sessionsService.listSessions(user.authUserId, user.sessionId);
  }

  @Delete('others')
  @RateLimit({ windowMs: 60_000, maxRequests: 5 })
  async revokeOtherSessions(@CurrentUser() user: AuthUser) {
    if (!user.authUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    const revoked = await this.sessionsService.revokeOtherSessions(
      user.authUserId,
      user.sessionId,
    );
    return { revoked };
  }

  @Delete(':id')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async revokeSession(
    @CurrentUser() user: AuthUser,
    @Param('id') sessionId: string,
  ) {
    if (!user.authUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    await this.sessionsService.revokeSession(user.authUserId, sessionId);
    return { revoked: true };
  }
}
