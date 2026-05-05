import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth';
import { RateLimitGuard, RateLimit } from '../auth/guards/rate-limit.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/user.dto';

@Controller('user')
@UseGuards(RateLimitGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUser(@CurrentUser() user: AuthUser) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.userService.getUser(user.internalUserId);
  }

  @Patch()
  @RateLimit({ windowMs: 60_000, maxRequests: 20 })
  async updateUser(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateUserDto,
  ) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.userService.updateUser(user.internalUserId, dto);
  }

  @Delete()
  @RateLimit({ windowMs: 60_000, maxRequests: 5 })
  async deleteUser(@CurrentUser() user: AuthUser) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    await this.userService.deleteUser(user.internalUserId);
    return { deleted: true };
  }
}
