import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<{
      user: AuthUser;
      teamMembership?: { role: string };
    }>();
    const user = request.user;
    const effectiveRole = request.teamMembership?.role ?? user?.role;

    if (!effectiveRole || !requiredRoles.includes(effectiveRole)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
