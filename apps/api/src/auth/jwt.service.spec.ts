import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service';
import * as jose from 'jose';

describe('JwtService', () => {
  let jwtService: JwtService;
  let privateKey: jose.KeyLike;
  let publicKey: jose.KeyLike;

  const SUPABASE_URL = 'https://test-project.supabase.co';
  const JWKS_URL = `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`;

  beforeAll(async () => {
    const keyPair = await jose.generateKeyPair('RS256');
    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;
  });

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'SUPABASE_JWKS_URL') return JWKS_URL;
        if (key === 'SUPABASE_URL') return SUPABASE_URL;
        throw new Error(`Unknown config key: ${key}`);
      }),
    } as unknown as ConfigService;

    jwtService = new JwtService(configService);

    // Override the JWKS with our test public key
    (jwtService as any).jwks = async (
      protectedHeader: jose.JWSHeaderParameters,
      token: jose.FlattenedJWSInput,
    ) => publicKey;
  });

  it('should verify a valid token and return AuthUser', async () => {
    const token = await new jose.SignJWT({
      sub: 'user-123',
      email: 'test@example.com',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(privateKey);

    const result = await jwtService.verifyToken(token);

    expect(result.authUserId).toBe('user-123');
    expect(result.email).toBe('test@example.com');
  });

  it('should reject a token with wrong audience', async () => {
    const token = await new jose.SignJWT({
      sub: 'user-123',
      email: 'test@example.com',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setAudience('wrong-audience')
      .setExpirationTime('1h')
      .sign(privateKey);

    await expect(jwtService.verifyToken(token)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject a token with missing sub', async () => {
    const token = await new jose.SignJWT({
      email: 'test@example.com',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(privateKey);

    await expect(jwtService.verifyToken(token)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject an expired token', async () => {
    const token = await new jose.SignJWT({
      sub: 'user-123',
      email: 'test@example.com',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setAudience('authenticated')
      .setExpirationTime('-1h')
      .sign(privateKey);

    await expect(jwtService.verifyToken(token)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
