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
  CreateTeamDto,
  RenameTeamDto,
} from './dto/team-management.dto';

function requireUser(user: AuthUser) {
  if (!user.internalUserId) {
    throw new UnauthorizedException('User not provisioned');
  }
  if (!user.activeTeamId) {
    throw new UnauthorizedException('No active team');
  }
  return {
    userId: user.internalUserId,
    teamId: user.activeTeamId,
  };
}

@Controller('team')
@UseGuards(RateLimitGuard)
export class TeamManagementController {
  constructor(private readonly teamService: TeamManagementService) {}

  @Post()
  @RateLimit({ windowMs: 60_000, maxRequests: 5 })
  async createTeam(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTeamDto,
  ) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.teamService.createTeam(
      user.internalUserId,
      dto.name,
      dto.slug,
      dto.logoUrl,
    );
  }

  @Get()
  async getTeam(@CurrentUser() user: AuthUser) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.getTeamDetails(userId, teamId);
  }

  @Patch()
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async renameTeam(
    @CurrentUser() user: AuthUser,
    @Body() dto: RenameTeamDto,
  ) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.renameTeam(userId, teamId, dto.name);
  }

  @Delete()
  @RateLimit({ windowMs: 60_000, maxRequests: 5 })
  async deleteTeam(@CurrentUser() user: AuthUser) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.deleteTeam(userId, teamId);
  }

  @Patch('logo')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async updateLogo(
    @CurrentUser() user: AuthUser,
    @Body('logoUrl') logoUrl: string | null,
  ) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.updateTeamLogo(userId, teamId, logoUrl ?? null);
  }

  @Post('invite')
  @RateLimit({ windowMs: 60_000, maxRequests: 20 })
  async invite(
    @CurrentUser() user: AuthUser,
    @Body() dto: InviteDto,
  ) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.inviteUser(userId, teamId, dto.email, dto.role);
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
    return this.teamService.acceptInvite(user.internalUserId, dto.invitationId);
  }

  @Post('decline')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async decline(
    @CurrentUser() user: AuthUser,
    @Body() dto: AcceptInviteDto,
  ) {
    if (!user.internalUserId) {
      throw new UnauthorizedException('User not provisioned');
    }
    return this.teamService.declineInvite(
      user.internalUserId,
      dto.invitationId,
    );
  }

  @Post('invite/:id/resend')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async resendInvite(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) invitationId: string,
  ) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.resendInvite(userId, teamId, invitationId);
  }

  @Delete('invite/:id')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async cancelInvite(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) invitationId: string,
  ) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.cancelInvite(userId, teamId, invitationId);
  }

  @Patch('role')
  @RateLimit({ windowMs: 60_000, maxRequests: 20 })
  async changeRole(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangeRoleDto,
  ) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.changeRole(userId, teamId, dto.memberId, dto.role);
  }

  @Patch('ownership')
  @RateLimit({ windowMs: 60_000, maxRequests: 5 })
  async transferOwnership(
    @CurrentUser() user: AuthUser,
    @Body('memberId', ParseUUIDPipe) memberId: string,
  ) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.transferOwnership(userId, teamId, memberId);
  }

  @Delete('member/:id')
  @RateLimit({ windowMs: 60_000, maxRequests: 10 })
  async removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) memberId: string,
  ) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.removeMember(userId, teamId, memberId);
  }

  @Post('leave')
  @RateLimit({ windowMs: 60_000, maxRequests: 5 })
  async leaveTeam(@CurrentUser() user: AuthUser) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.leaveTeam(userId, teamId);
  }

  @Get('activity')
  async getActivity(@CurrentUser() user: AuthUser) {
    const { userId, teamId } = requireUser(user);
    return this.teamService.getTeamActivity(userId, teamId);
  }
}
