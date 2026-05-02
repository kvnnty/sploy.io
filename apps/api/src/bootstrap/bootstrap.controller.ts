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
import { BootstrapDto, SwitchOrgDto } from './dto/bootstrap.dto';
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
      orgName: dto.orgName,
      orgSlug: dto.orgSlug,
    });

    if (result.isNewUser) {
      await this.audit.log({
        eventType: 'user_bootstrapped',
        userId: result.userId,
        orgId: result.orgId,
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
        metadata: { email: user.email },
      });
    }
    if (result.isNewOrg) {
      await this.audit.log({
        eventType: 'org_created',
        userId: result.userId,
        orgId: result.orgId,
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }

    return result;
  }

  @Post('switch-org')
  async switchOrg(
    @CurrentUser() user: AuthUser,
    @Body() dto: SwitchOrgDto,
  ) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.bootstrapService.switchOrg(user.internalUserId, dto.orgId);
  }

  @Get('orgs')
  async listOrgs(@CurrentUser() user: AuthUser) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.bootstrapService.listOrgs(user.internalUserId);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return {
      authUserId: user.authUserId,
      email: user.email,
      internalUserId: user.internalUserId,
      activeOrgId: user.activeOrgId,
      role: user.role,
    };
  }
}
