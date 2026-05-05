import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TeamRole, InvitationStatus } from '@prisma/client';
import { PrismaService } from '../database';
import { NOTIFICATION_EVENTS } from '../notifications/events';

@Injectable()
export class TeamManagementService {
  private readonly logger = new Logger(TeamManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getTeamDetails(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      include: {
        team: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!membership) {
      throw new NotFoundException('No team found');
    }

    const members = await this.prisma.membership.findMany({
      where: { teamId: membership.teamId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    const invites = await this.prisma.invitation.findMany({
      where: { teamId: membership.teamId, status: InvitationStatus.pending },
      orderBy: { createdAt: 'desc' },
    });

    return {
      team: {
        id: membership.team.id,
        name: membership.team.name,
        slug: membership.team.slug,
      },
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        displayName: m.user.displayName,
        role: m.role,
      })),
      invites: invites.map((i) => ({
        id: i.id,
        email: i.email,
        status: i.status,
        createdAt: i.createdAt.toISOString(),
      })),
      currentUserId: userId,
    };
  }

  async inviteUser(inviterId: string, email: string) {
    const inviterMembership = await this.requireAdminMembership(inviterId);
    const teamId = inviterMembership.teamId;

    const existingMember = await this.prisma.membership.findFirst({
      where: { teamId, user: { email } },
    });
    if (existingMember) {
      throw new ConflictException('User is already a member');
    }

    const existingInvite = await this.prisma.invitation.findFirst({
      where: { teamId, email, status: InvitationStatus.pending },
    });
    if (existingInvite) {
      throw new ConflictException('Invitation already pending for this email');
    }

    const [invitation, inviter, team] = await Promise.all([
      this.prisma.invitation.create({
        data: {
          teamId,
          email,
          invitedBy: inviterId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
      this.prisma.user.findFirst({
        where: { id: inviterId },
        select: { displayName: true },
      }),
      this.prisma.team.findFirst({
        where: { id: teamId },
        select: { name: true },
      }),
    ]);

    this.logger.log(`Invitation sent to ${email} for team ${teamId}`);

    this.eventEmitter.emit(NOTIFICATION_EVENTS.TEAM_INVITE, {
      inviteeEmail: email,
      teamId,
      teamName: team?.name ?? 'your team',
      invitationId: invitation.id,
      inviterName: inviter?.displayName ?? null,
    });

    return {
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      createdAt: invitation.createdAt.toISOString(),
    };
  }

  async acceptInvite(userId: string, invitationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        email: user.email,
        status: InvitationStatus.pending,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or expired');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.expired },
      });
      throw new BadRequestException('Invitation has expired');
    }

    await this.prisma.$transaction([
      this.prisma.membership.create({
        data: {
          userId,
          teamId: invitation.teamId,
          role: invitation.role,
        },
      }),
      this.prisma.invitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.accepted },
      }),
    ]);

    this.logger.log(
      `User ${userId} accepted invitation ${invitationId} for team ${invitation.teamId}`,
    );

    const team = await this.prisma.team.findFirst({
      where: { id: invitation.teamId },
      select: { name: true },
    });
    this.eventEmitter.emit(NOTIFICATION_EVENTS.INVITE_ACCEPTED, {
      userId: invitation.invitedBy,
      teamId: invitation.teamId,
      teamName: team?.name ?? 'the team',
      invitationId: invitation.id,
      accepterName: user.displayName ?? user.email,
    });

    return { accepted: true };
  }

  async changeRole(
    actorId: string,
    memberId: string,
    newRole: 'admin' | 'member',
  ) {
    const actorMembership = await this.requireAdminMembership(actorId);

    const target = await this.prisma.membership.findFirst({
      where: { id: memberId, teamId: actorMembership.teamId },
    });
    if (!target) throw new NotFoundException('Member not found');

    if (target.role === TeamRole.owner) {
      throw new ForbiddenException('Cannot change owner role directly');
    }

    await this.prisma.membership.update({
      where: { id: memberId },
      data: { role: newRole as TeamRole },
    });

    this.logger.log(`Role changed for member ${memberId} to ${newRole}`);

    const [team, actor] = await Promise.all([
      this.prisma.team.findFirst({
        where: { id: actorMembership.teamId },
        select: { name: true },
      }),
      this.prisma.user.findFirst({
        where: { id: actorId },
        select: { displayName: true },
      }),
    ]);
    this.eventEmitter.emit(NOTIFICATION_EVENTS.ROLE_CHANGED, {
      targetUserId: target.userId,
      memberId,
      newRole,
      teamName: team?.name ?? 'your team',
      actorName: actor?.displayName ?? null,
    });

    return { updated: true };
  }

  async removeMember(actorId: string, memberId: string) {
    const actorMembership = await this.requireAdminMembership(actorId);

    const target = await this.prisma.membership.findFirst({
      where: { id: memberId, teamId: actorMembership.teamId },
    });
    if (!target) throw new NotFoundException('Member not found');

    if (target.role === TeamRole.owner) {
      throw new ForbiddenException('Cannot remove the team owner');
    }
    if (target.userId === actorId) {
      throw new ForbiddenException('Cannot remove yourself');
    }

    const [team, actor] = await Promise.all([
      this.prisma.team.findFirst({
        where: { id: actorMembership.teamId },
        select: { name: true },
      }),
      this.prisma.user.findFirst({
        where: { id: actorId },
        select: { displayName: true },
      }),
    ]);

    await this.prisma.membership.delete({ where: { id: memberId } });
    this.logger.log(`Member ${memberId} removed from team`);

    this.eventEmitter.emit(NOTIFICATION_EVENTS.MEMBER_REMOVED, {
      targetUserId: target.userId,
      memberId,
      teamId: actorMembership.teamId,
      teamName: team?.name ?? 'the team',
      actorName: actor?.displayName ?? null,
    });

    return { removed: true };
  }

  private async requireAdminMembership(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (!membership) {
      throw new ForbiddenException('No team membership');
    }
    if (
      membership.role !== TeamRole.owner &&
      membership.role !== TeamRole.admin
    ) {
      throw new ForbiddenException('Insufficient role');
    }

    return membership;
  }
}
