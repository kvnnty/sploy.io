import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth';
import { RateLimitGuard, RateLimit } from '../auth/guards/rate-limit.guard';
import { ProvidersService } from './providers.service';

@Controller('auth')
@UseGuards(RateLimitGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get('providers')
  @RateLimit({ windowMs: 60_000, maxRequests: 30 })
  async listProviders(@CurrentUser() user: AuthUser) {
    if (!user.authUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.providersService.listProviders(user.authUserId);
  }

  @Post('connect/:provider')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async connectProvider(
    @CurrentUser() user: AuthUser,
    @Param('provider') provider: string,
  ) {
    if (!user.authUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.providersService.connectProvider(user.authUserId, provider);
  }

  @Delete('disconnect/:provider')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async disconnectProvider(
    @CurrentUser() user: AuthUser,
    @Param('provider') provider: string,
  ) {
    if (!user.authUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    await this.providersService.disconnectProvider(user.authUserId, provider);
    return { disconnected: true };
  }
}
