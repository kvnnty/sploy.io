import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { JwtService } from '../jwt.service';
import { UserResolutionService } from '../user-resolution.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let userResolution: jest.Mocked<UserResolutionService>;
  let reflector: Reflector;

  beforeEach(() => {
    jwtService = {
      verifyToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    userResolution = {
      resolve: jest.fn(),
    } as unknown as jest.Mocked<UserResolutionService>;

    reflector = new Reflector();
    guard = new AuthGuard(jwtService, userResolution, reflector);
  });

  function createMockContext(
    authHeader?: string,
    isPublic = false,
  ): ExecutionContext {
    const request = {
      headers: { authorization: authHeader },
      user: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => {
        const fn = () => {};
        if (isPublic) {
          Reflect.defineMetadata('isPublic', true, fn);
        }
        return fn;
      },
      getClass: () => class {},
    } as unknown as ExecutionContext;
  }

  it('should allow public routes', async () => {
    const context = createMockContext(undefined, true);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should reject requests without bearer token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject requests with invalid format', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext('Basic abc');
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should verify token and resolve user', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const authUser = { authUserId: 'u1', email: 'a@b.com' };
    const resolved = { ...authUser, internalUserId: 'int-1' };
    jwtService.verifyToken.mockResolvedValue(authUser);
    userResolution.resolve.mockResolvedValue(resolved);

    const context = createMockContext('Bearer valid-token');
    expect(await guard.canActivate(context)).toBe(true);
    expect(jwtService.verifyToken).toHaveBeenCalledWith('valid-token');
    expect(userResolution.resolve).toHaveBeenCalledWith(authUser);
  });
});
