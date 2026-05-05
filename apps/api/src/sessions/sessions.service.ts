import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../database';
import { NOTIFICATION_EVENTS } from '../notifications/events';

type SessionLocation = {
  city: string | null;
  country: string | null;
};

type SessionSummary = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  device: string;
  browser: string;
  location: SessionLocation;
  lastActiveAt: string;
  current: boolean;
};

@Injectable()
export class SessionsService {
  private readonly locationCache = new Map<
    string,
    { value: SessionLocation; expiresAt: number }
  >();
  private readonly clerkSecretKey: string;
  private static readonly LOCATION_TTL_MS = 6 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    config: ConfigService,
  ) {
    this.clerkSecretKey = config.get<string>('CLERK_SECRET_KEY', '');
  }

  async touchSession(input: {
    userId: string;
    authSessionId: string;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void> {
    const existing = await this.prisma.userSession.findUnique({
      where: { authSessionId: input.authSessionId },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.userSession.update({
        where: { id: existing.id },
        data: {
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          lastActiveAt: new Date(),
        },
      });
    } else {
      await this.prisma.userSession.create({
        data: {
          userId: input.userId,
          authSessionId: input.authSessionId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          lastActiveAt: new Date(),
        },
      });

      this.eventEmitter.emit(NOTIFICATION_EVENTS.NEW_SESSION, {
        userId: input.userId,
        authSessionId: input.authSessionId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    }
  }

  async listSessions(
    authUserId: string,
    currentSessionId?: string,
  ): Promise<SessionSummary[]> {
    const user = await this.prisma.user.findFirst({
      where: { authUserId },
      select: { id: true },
    });
    if (!user) return [];

    const sessions = await this.prisma.userSession.findMany({
      where: { userId: user.id },
      orderBy: { lastActiveAt: 'desc' },
    });

    return Promise.all(
      sessions.map(async (s) => {
        const parsed = this.parseUserAgent(s.userAgent);
        return {
          id: s.id,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          device: parsed.device,
          browser: parsed.browser,
          location: await this.lookupLocation(s.ipAddress),
          lastActiveAt: s.lastActiveAt.toISOString(),
          current: Boolean(
            currentSessionId && s.authSessionId === currentSessionId,
          ),
        };
      }),
    );
  }

  async revokeSession(authUserId: string, sessionId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { authUserId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId: user.id },
      select: { id: true, authSessionId: true },
    });
    if (!session) {
      throw new NotFoundException('Session not found or already revoked');
    }

    await this.revokeClerkSession(session.authSessionId);

    await this.prisma.userSession.delete({
      where: { id: session.id },
    });
  }

  async revokeOtherSessions(
    authUserId: string,
    currentSessionId?: string,
  ): Promise<number> {
    const user = await this.prisma.user.findFirst({
      where: { authUserId },
      select: { id: true },
    });
    if (!user) return 0;

    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId: user.id,
        ...(currentSessionId
          ? { authSessionId: { not: currentSessionId } }
          : {}),
      },
      select: { id: true, authSessionId: true },
    });

    await Promise.all(
      sessions.map((session) => this.revokeClerkSession(session.authSessionId)),
    );

    const result = await this.prisma.userSession.deleteMany({
      where: { id: { in: sessions.map((s) => s.id) } },
    });

    return result.count;
  }

  private parseUserAgent(userAgent: string | null): {
    device: string;
    browser: string;
  } {
    if (!userAgent)
      return { device: 'Unknown device', browser: 'Unknown browser' };
    const ua = userAgent.toLowerCase();

    const device = ua.includes('mobile')
      ? 'Mobile'
      : ua.includes('tablet')
        ? 'Tablet'
        : ua.includes('mac os')
          ? 'Mac'
          : ua.includes('windows')
            ? 'Windows PC'
            : ua.includes('linux')
              ? 'Linux'
              : 'Desktop';

    const browser = ua.includes('edg/')
      ? 'Edge'
      : ua.includes('chrome/')
        ? 'Chrome'
        : ua.includes('safari/') && !ua.includes('chrome/')
          ? 'Safari'
          : ua.includes('firefox/')
            ? 'Firefox'
            : ua.includes('opr/')
              ? 'Opera'
              : 'Unknown browser';

    return { device, browser };
  }

  private async lookupLocation(
    ipAddress: string | null,
  ): Promise<SessionLocation> {
    if (!ipAddress) return { city: null, country: null };

    const now = Date.now();
    const cached = this.locationCache.get(ipAddress);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    try {
      const res = await fetch(
        `https://ipwho.is/${encodeURIComponent(ipAddress)}`,
      );
      if (!res.ok) return { city: null, country: null };
      const data = (await res.json()) as {
        success?: boolean;
        city?: string;
        country?: string;
      };
      if (!data.success) return { city: null, country: null };
      const value = {
        city: data.city ?? null,
        country: data.country ?? null,
      };
      this.locationCache.set(ipAddress, {
        value,
        expiresAt: now + SessionsService.LOCATION_TTL_MS,
      });
      return value;
    } catch {
      return { city: null, country: null };
    }
  }

  private async revokeClerkSession(authSessionId: string): Promise<void> {
    if (!this.clerkSecretKey) return;
    await fetch(`https://api.clerk.com/v1/sessions/${authSessionId}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.clerkSecretKey}` },
    }).catch(() => undefined);
  }
}
