import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth';
import { RateLimitGuard, RateLimit } from '../auth/guards/rate-limit.guard';
import { TeamManagementService } from './team-management.service';
import {
  InviteDto,
  AcceptInviteDto,
  ChangeRoleDto,
} from './dto/team-management.dto';

@Controller('team')
@UseGuards(RateLimitGuard)
export class TeamManagementController {
  constructor(private readonly teamService: TeamManagementService) {}

  @Get()
  async getTeam(@CurrentUser() user: AuthUser) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.teamService.getTeamDetails(user.internalUserId);
  }

  @Post('invite')
  @RateLimit({ windowMs: 60_000, maxRequests: 20 })
  async invite(
    @CurrentUser() user: AuthUser,
    @Body() dto: InviteDto,
  ) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.teamService.inviteUser(user.internalUserId, dto.email);
  }

  @Post('accept')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async accept(
    @CurrentUser() user: AuthUser,
    @Body() dto: AcceptInviteDto,
  ) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.teamService.acceptInvite(
      user.internalUserId,
      dto.invitationId,
    );
  }

  @Patch('role')
  @RateLimit({ windowMs: 60_000, maxRequests: 20 })
  async changeRole(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangeRoleDto,
  ) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.teamService.changeRole(
      user.internalUserId,
      dto.memberId,
      dto.role,
    );
  }

  @Delete('member/:id')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) memberId: string,
  ) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.teamService.removeMember(user.internalUserId, memberId);
  }
}
