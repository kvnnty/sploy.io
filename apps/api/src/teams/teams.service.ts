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
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async logActivity(
    teamId: string,
    actorUserId: string | null,
    type: string,
    metadata: Record<string, unknown> = {},
  ) {
    try {
      await this.prisma.teamActivity.create({
        data: {
          teamId,
          actorUserId,
          type,
          metadata: metadata as any,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to log team activity: ${err}`);
    }
  }

  async getTeamActivity(userId: string, teamId: string, limit = 50) {
    await this.requireMembership(userId, teamId);

    const cap = Math.min(limit, 50);
    const rows = await this.prisma.teamActivity.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: cap,
      include: {
        actor: { select: { displayName: true, email: true } },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      actorName: r.actor?.displayName ?? r.actor?.email ?? null,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  private toSlug(value: string): string {
    const base = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    return base || 'team';
  }

  private async requireMembership(
    userId: string,
    teamId: string,
    minRole?: TeamRole,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, teamId },
    });
    if (!membership) {
      throw new ForbiddenException('No team membership');
    }
    if (minRole) {
      const hierarchy: Record<string, number> = {
        [TeamRole.owner]: 3,
        [TeamRole.admin]: 2,
        [TeamRole.member]: 1,
        [TeamRole.viewer]: 0,
      };
      if ((hierarchy[membership.role] ?? 0) < (hierarchy[minRole] ?? 0)) {
        throw new ForbiddenException('Insufficient role');
      }
    }
    return membership;
  }

  async getTeamDetails(userId: string, teamId: string) {
    await this.requireMembership(userId, teamId);

    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });

    const members = await this.prisma.membership.findMany({
      where: { teamId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    const invites = await this.prisma.invitation.findMany({
      where: { teamId, status: InvitationStatus.pending },
      orderBy: { createdAt: 'desc' },
    });

    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { email: true },
    });

    const incomingInvites = user
      ? await this.prisma.invitation.findMany({
          where: {
            email: user.email,
            status: InvitationStatus.pending,
            expiresAt: { gt: new Date() },
          },
          include: { team: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    return {
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        logoUrl: team.logoUrl,
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
        role: i.role,
        status: i.status,
        createdAt: i.createdAt.toISOString(),
      })),
      incomingInvites: incomingInvites
        .filter((i) => i.teamId !== teamId)
        .map((i) => ({
          id: i.id,
          teamId: i.teamId,
          teamName: i.team.name,
          role: i.role,
          createdAt: i.createdAt.toISOString(),
        })),
      currentUserId: userId,
    };
  }

  async inviteUser(
    inviterId: string,
    teamId: string,
    email: string,
    role?: 'admin' | 'member',
  ) {
    const inviteRole = (role ?? 'member') as TeamRole;
    await this.requireMembership(inviterId, teamId, TeamRole.admin);

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
          role: inviteRole,
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
    await this.logActivity(teamId, inviterId, 'invite_sent', {
      email,
      role: inviteRole,
    });

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
      role: invitation.role,
      status: invitation.status,
      createdAt: invitation.createdAt.toISOString(),
    };
  }

  async acceptInvite(userId: string, invitationId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
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
    await this.logActivity(invitation.teamId, userId, 'invite_accepted', {
      email: user.email,
    });

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

  async declineInvite(userId: string, invitationId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        email: user.email,
        status: InvitationStatus.pending,
      },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.declined },
    });
    await this.logActivity(invitation.teamId, userId, 'invite_declined', {
      email: user.email,
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.INVITE_DECLINED, {
      userId: invitation.invitedBy,
      teamId: invitation.teamId,
      invitationId: invitation.id,
      declinerEmail: user.email,
      declinerName: user.displayName ?? user.email,
    });

    return { declined: true };
  }

  async resendInvite(actorId: string, teamId: string, invitationId: string) {
    await this.requireMembership(actorId, teamId, TeamRole.admin);

    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, teamId, status: InvitationStatus.pending },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    await this.logActivity(teamId, actorId, 'invite_resent', {
      email: invitation.email,
    });

    const [inviter, team] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: actorId },
        select: { displayName: true },
      }),
      this.prisma.team.findFirst({
        where: { id: teamId },
        select: { name: true },
      }),
    ]);

    this.eventEmitter.emit(NOTIFICATION_EVENTS.TEAM_INVITE, {
      inviteeEmail: invitation.email,
      teamId,
      teamName: team?.name ?? 'your team',
      invitationId: invitation.id,
      inviterName: inviter?.displayName ?? null,
    });

    return { resent: true };
  }

  async cancelInvite(actorId: string, teamId: string, invitationId: string) {
    await this.requireMembership(actorId, teamId, TeamRole.admin);

    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, teamId, status: InvitationStatus.pending },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.invitation.delete({ where: { id: invitationId } });
    await this.logActivity(teamId, actorId, 'invite_cancelled', {
      email: invitation.email,
    });
    return { cancelled: true };
  }

  async changeRole(
    actorId: string,
    teamId: string,
    memberId: string,
    newRole: 'admin' | 'member',
  ) {
    const actor = await this.requireMembership(actorId, teamId, TeamRole.admin);

    const target = await this.prisma.membership.findFirst({
      where: { id: memberId, teamId },
    });
    if (!target) throw new NotFoundException('Member not found');

    if (target.role === TeamRole.owner) {
      throw new ForbiddenException('Cannot change owner role directly');
    }

    if (actor.role !== TeamRole.owner && target.role === TeamRole.admin) {
      throw new ForbiddenException('Only the owner can change admin roles');
    }

    await this.prisma.membership.update({
      where: { id: memberId },
      data: { role: newRole as TeamRole },
    });

    this.logger.log(`Role changed for member ${memberId} to ${newRole}`);
    await this.logActivity(teamId, actorId, 'role_changed', {
      memberId,
      newRole,
    });

    const [teamRecord, actorUser] = await Promise.all([
      this.prisma.team.findFirst({
        where: { id: teamId },
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
      teamName: teamRecord?.name ?? 'your team',
      actorName: actorUser?.displayName ?? null,
    });

    return { updated: true };
  }

  async transferOwnership(actorId: string, teamId: string, memberId: string) {
    await this.requireMembership(actorId, teamId, TeamRole.owner);

    const target = await this.prisma.membership.findFirst({
      where: { id: memberId, teamId },
    });
    if (!target) throw new NotFoundException('Member not found');

    if (target.userId === actorId) {
      throw new BadRequestException('Cannot transfer ownership to yourself');
    }

    const actorMembership = await this.prisma.membership.findFirst({
      where: { userId: actorId, teamId },
    });

    await this.prisma.$transaction([
      this.prisma.membership.update({
        where: { id: target.id },
        data: { role: TeamRole.owner },
      }),
      this.prisma.membership.update({
        where: { id: actorMembership!.id },
        data: { role: TeamRole.admin },
      }),
    ]);

    await this.logActivity(teamId, actorId, 'ownership_transferred', {
      newOwnerId: target.userId,
    });

    const [teamRecord, actorUser] = await Promise.all([
      this.prisma.team.findFirst({
        where: { id: teamId },
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
      newRole: 'owner',
      teamName: teamRecord?.name ?? 'your team',
      actorName: actorUser?.displayName ?? null,
    });

    return { transferred: true };
  }

  async removeMember(actorId: string, teamId: string, memberId: string) {
    const actor = await this.requireMembership(actorId, teamId, TeamRole.admin);

    const target = await this.prisma.membership.findFirst({
      where: { id: memberId, teamId },
      include: { user: true },
    });
    if (!target) throw new NotFoundException('Member not found');

    if (target.role === TeamRole.owner) {
      throw new ForbiddenException('Cannot remove the team owner');
    }
    if (target.userId === actorId) {
      throw new ForbiddenException('Use the leave endpoint to remove yourself');
    }
    if (actor.role !== TeamRole.owner && target.role === TeamRole.admin) {
      throw new ForbiddenException('Only the owner can remove admins');
    }

    const [teamRecord, actorUser] = await Promise.all([
      this.prisma.team.findFirst({
        where: { id: teamId },
        select: { name: true },
      }),
      this.prisma.user.findFirst({
        where: { id: actorId },
        select: { displayName: true },
      }),
    ]);

    await this.prisma.membership.delete({ where: { id: memberId } });

    if (target.user.preferredTeamId === teamId) {
      await this.prisma.user.update({
        where: { id: target.userId },
        data: { preferredTeamId: null },
      });
    }

    this.logger.log(`Member ${memberId} removed from team ${teamId}`);
    await this.logActivity(teamId, actorId, 'member_removed', {
      userId: target.userId,
      email: target.user.email,
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.MEMBER_REMOVED, {
      targetUserId: target.userId,
      memberId,
      teamId,
      teamName: teamRecord?.name ?? 'the team',
      actorName: actorUser?.displayName ?? null,
    });

    return { removed: true };
  }

  async createTeam(
    userId: string,
    name: string,
    slug?: string,
    logoUrl?: string,
  ) {
    const finalSlug = slug ?? this.toSlug(name);

    const slugTaken = await this.prisma.team.findFirst({
      where: { slug: finalSlug },
      select: { id: true },
    });
    if (slugTaken) {
      throw new ConflictException(`Team slug "${finalSlug}" is taken`);
    }

    const team = await this.prisma.team.create({
      data: {
        name,
        slug: finalSlug,
        logoUrl: logoUrl ?? null,
        memberships: {
          create: { userId, role: TeamRole.owner },
        },
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { preferredTeamId: team.id },
    });

    await this.logActivity(team.id, userId, 'team_created', { name });

    return {
      id: team.id,
      name: team.name,
      slug: team.slug,
      logoUrl: team.logoUrl,
    };
  }

  async updateTeamLogo(userId: string, teamId: string, logoUrl: string | null) {
    await this.requireMembership(userId, teamId, TeamRole.admin);
    await this.prisma.team.update({
      where: { id: teamId },
      data: { logoUrl },
    });
    return { updated: true, logoUrl };
  }

  async renameTeam(userId: string, teamId: string, name: string) {
    await this.requireMembership(userId, teamId, TeamRole.admin);

    await this.prisma.team.update({
      where: { id: teamId },
      data: { name },
    });

    await this.logActivity(teamId, userId, 'team_renamed', { name });

    return { updated: true };
  }

  async deleteTeam(userId: string, teamId: string) {
    await this.requireMembership(userId, teamId, TeamRole.owner);

    const memberCount = await this.prisma.membership.count({
      where: { teamId },
    });
    if (memberCount > 1) {
      throw new ForbiddenException(
        'Remove all other members or transfer ownership before deleting the team',
      );
    }

    await this.prisma.user.updateMany({
      where: { preferredTeamId: teamId },
      data: { preferredTeamId: null },
    });

    await this.prisma.team.delete({ where: { id: teamId } });

    return { deleted: true };
  }

  async leaveTeam(userId: string, teamId: string) {
    const membership = await this.requireMembership(userId, teamId);

    if (membership.role === TeamRole.owner) {
      const otherOwners = await this.prisma.membership.count({
        where: { teamId, role: TeamRole.owner, userId: { not: userId } },
      });
      if (otherOwners === 0) {
        throw new ForbiddenException(
          'You are the sole owner. Transfer ownership before leaving.',
        );
      }
    }

    await this.prisma.membership.delete({ where: { id: membership.id } });
    await this.logActivity(teamId, userId, 'member_left');

    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { preferredTeamId: true },
    });
    if (user?.preferredTeamId === teamId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { preferredTeamId: null },
      });
    }

    return { left: true };
  }
}
