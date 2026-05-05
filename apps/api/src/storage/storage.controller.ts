import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UnauthorizedException,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser, type AuthUser } from '../auth';
import { RateLimitGuard, RateLimit } from '../auth/guards/rate-limit.guard';
import { StorageService, type UploadScope } from './storage.service';

@Controller('uploads')
@UseGuards(RateLimitGuard)
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('team-avatar')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadTeamAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('teamId') teamId?: string,
  ) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const targetTeamId = teamId ?? user.activeTeamId;
    if (!targetTeamId) {
      throw new BadRequestException('No team specified');
    }

    const scope: UploadScope = { type: 'team-avatar', teamId: targetTeamId };
    const result = await this.storage.uploadAvatar(scope, file);
    return result;
  }

  @Post('user-avatar')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadUserAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const scope: UploadScope = {
      type: 'user-avatar',
      userId: user.internalUserId,
    };
    const result = await this.storage.uploadAvatar(scope, file);
    return result;
  }
}
