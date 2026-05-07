import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, verifyToken } from '@clerk/backend';
import type { AuthUser } from './interfaces/auth-user.interface';

function emailFromJwtPayload(raw: Record<string, unknown>): string | undefined {
  const direct =
    (typeof raw.email === 'string' ? raw.email : undefined) ??
    (typeof raw.email_address === 'string' ? raw.email_address : undefined) ??
    (typeof raw.primary_email_address === 'string'
      ? raw.primary_email_address
      : undefined);
  if (direct) return direct;

  const list = raw.email_addresses;
  if (Array.isArray(list) && list.length > 0) {
    const first = list[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'email_address' in first) {
      const v = (first as { email_address?: unknown }).email_address;
      if (typeof v === 'string') return v;
    }
  }
  return undefined;
}

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private readonly secretKey: string;
  private readonly authorizedParties: string[];
  private readonly clerk: ReturnType<typeof createClerkClient>;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.getOrThrow<string>('CLERK_SECRET_KEY');
    this.authorizedParties = this.config
      .getOrThrow<string>('CORS_ORIGIN')
      .split(',')
      .map((o) => o.trim());
    this.clerk = createClerkClient({ secretKey: this.secretKey });
  }

  /**
   * Session JWT templates often omit `email`. Use the Clerk Backend API to
   * load the primary address (only when the token did not include one).
   */
  async withEmailFromClerkIfMissing(authUser: AuthUser): Promise<AuthUser> {
    if (authUser.email) return authUser;
    try {
      const user = await this.clerk.users.getUser(authUser.authUserId);
      const email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress;
      if (email) return { ...authUser, email };
    } catch (err) {
      this.logger.warn(
        `Clerk user lookup failed for ${authUser.authUserId}: ${err}`,
      );
    }
    return authUser;
  }

  async verify(token: string): Promise<AuthUser> {
    try {
      const payload = await verifyToken(token, {
        secretKey: this.secretKey,
        authorizedParties: this.authorizedParties,
      });

      const sub = payload.sub;
      const raw = payload as Record<string, unknown>;
      const email = emailFromJwtPayload(raw);
      const sessionId = (payload as Record<string, unknown>).sid as
        | string
        | undefined;

      if (!sub) {
        throw new UnauthorizedException('Token missing required claims');
      }

      return { authUserId: sub, email, sessionId };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn(`JWT verification failed: ${error}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
