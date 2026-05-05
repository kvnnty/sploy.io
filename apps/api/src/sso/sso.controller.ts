import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, Public, Roles, type AuthUser } from '../auth';
import { RateLimitGuard, RateLimit } from '../auth/guards/rate-limit.guard';
import { SsoService } from './sso.service';
import {
  CreateSsoConnectionDto,
  DiscoverSsoDto,
  UpdateSsoConnectionDto,
} from './dto/sso.dto';

@Controller('auth/sso')
@UseGuards(RateLimitGuard)
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Public()
  @Get('discover')
  @RateLimit({ windowMs: 60_000, maxRequests: 20 })
  async discover(@Query() dto: DiscoverSsoDto) {
    const result = await this.ssoService.discover(dto.domain);
    if (!result) {
      return { found: false };
    }
    return { found: true, ...result };
  }

  @Post('connections')
  @Roles('owner', 'admin')
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSsoConnectionDto,
  ) {
    if (!user.internalUserId) throw new UnauthorizedException('User not provisioned');
    return this.ssoService.createConnection(user.internalUserId, dto);
  }

  @Get('connections')
  async list(@CurrentUser() user: AuthUser) {
    if (!user.activeTeamId) return [];
    return this.ssoService.listConnections(user.activeTeamId);
  }

  @Patch('connections/:id')
  @Roles('owner', 'admin')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSsoConnectionDto,
  ) {
    if (!user.internalUserId) throw new UnauthorizedException('User not provisioned');
    return this.ssoService.updateConnection(user.internalUserId, id, dto);
  }

  @Delete('connections/:id')
  @Roles('owner', 'admin')
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    if (!user.internalUserId) throw new UnauthorizedException('User not provisioned');
    await this.ssoService.deleteConnection(user.internalUserId, id);
    return { deleted: true };
  }
}
