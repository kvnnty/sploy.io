import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth';
import { RateLimitGuard, RateLimit } from '../auth/guards/rate-limit.guard';
import { AuditService } from '../audit';
import { BootstrapService } from './bootstrap.service';
import { BootstrapDto, SwitchTeamDto } from './dto/bootstrap.dto';
import type { Request } from 'express';

@Controller('auth')
@UseGuards(RateLimitGuard)
export class BootstrapController {
  constructor(
    private readonly bootstrapService: BootstrapService,
    private readonly audit: AuditService,
  ) {}

  @Post('bootstrap')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async bootstrap(
    @CurrentUser() user: AuthUser,
    @Body() dto: BootstrapDto,
    @Req() req: Request,
  ) {
    const result = await this.bootstrapService.bootstrap(user, {
      displayName: dto.displayName,
      teamName: dto.teamName,
      teamSlug: dto.teamSlug,
    });

    if (result.isNewUser) {
      await this.audit.log({
        eventType: 'user_bootstrapped',
        userId: result.userId,
        teamId: result.teamId,
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
        metadata: { email: user.email },
      });
    }
    if (result.isNewTeam) {
      await this.audit.log({
        eventType: 'team_created',
        userId: result.userId,
        teamId: result.teamId,
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }

    return result;
  }

  @Post('switch-team')
  async switchTeam(
    @CurrentUser() user: AuthUser,
    @Body() dto: SwitchTeamDto,
  ) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.bootstrapService.switchTeam(user.internalUserId, dto.teamId);
  }

  @Get('teams')
  async listTeams(@CurrentUser() user: AuthUser) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.bootstrapService.listTeams(user.internalUserId);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return {
      authUserId: user.authUserId,
      email: user.email,
      internalUserId: user.internalUserId,
      activeTeamId: user.activeTeamId,
      role: user.role,
    };
  }
}
