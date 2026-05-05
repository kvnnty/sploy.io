import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtService } from '../jwt.service';
import { UserResolutionService } from '../user-resolution.service';
import { SessionsService } from '../../sessions/sessions.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userResolution: UserResolutionService,
    private readonly sessionsService: SessionsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<
      Request & {
        user?: unknown;
      }
    >();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice(7);
    const authUser = await this.jwtService.verify(token);

    const resolved = await this.userResolution.resolve(authUser);
    request.user = resolved;

    if (resolved.internalUserId && resolved.sessionId) {
      await this.sessionsService.touchSession({
        userId: resolved.internalUserId,
        authSessionId: resolved.sessionId,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'] ?? null,
      });
    }

    return true;
  }

  private getClientIp(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
      return forwarded.split(',')[0]?.trim() ?? null;
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0]?.split(',')[0]?.trim() ?? null;
    }
    return request.ip ?? null;
  }
}
