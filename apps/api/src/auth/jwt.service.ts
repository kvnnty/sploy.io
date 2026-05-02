import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import type { AuthUser } from './interfaces/auth-user.interface';

@Injectable()
export class JwtService {
  private jwks!: ReturnType<typeof jose.createRemoteJWKSet>;
  private readonly logger = new Logger(JwtService.name);

  constructor(private readonly config: ConfigService) {
    const jwksUrl = this.config.getOrThrow<string>('SUPABASE_JWKS_URL');
    this.jwks = jose.createRemoteJWKSet(new URL(jwksUrl));
  }

  async verifyToken(token: string): Promise<AuthUser> {
    try {
      const { payload } = await jose.jwtVerify(token, this.jwks, {
        issuer: this.config.getOrThrow<string>('SUPABASE_URL') + '/auth/v1',
        audience: 'authenticated',
      });

      const sub = payload.sub;
      const email = payload.email as string | undefined;

      if (!sub || !email) {
        throw new UnauthorizedException('Token missing required claims');
      }

      return { authUserId: sub, email };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn(`JWT verification failed: ${error}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
