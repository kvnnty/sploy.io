import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import type { AuthUser } from './interfaces/auth-user.interface';

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private readonly secretKey: string;
  private readonly authorizedParties: string[];

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.getOrThrow<string>('CLERK_SECRET_KEY');
    this.authorizedParties = this.config
      .getOrThrow<string>('CORS_ORIGIN')
      .split(',')
      .map((o) => o.trim());
  }

  async verify(token: string): Promise<AuthUser> {
    try {
      const payload = await verifyToken(token, {
        secretKey: this.secretKey,
        authorizedParties: this.authorizedParties,
      });

      const sub = payload.sub;
      const email = (payload as Record<string, unknown>).email as
        | string
        | undefined;
      const sessionId = (payload as Record<string, unknown>).sid as
        | string
        | undefined;

      if (!sub || !email) {
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
