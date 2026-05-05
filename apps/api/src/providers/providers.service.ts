import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ProviderStatus {
  provider: string;
  connected: boolean;
  email: string | null;
}

interface ClerkExternalAccount {
  id: string;
  provider: string;
  email_address: string;
  verification: { status: string } | null;
}

interface ClerkUser {
  id: string;
  external_accounts: ClerkExternalAccount[];
  password_enabled: boolean;
}

const SUPPORTED_PROVIDERS = ['google', 'github', 'microsoft'];

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);
  private readonly clerkSecretKey: string;

  constructor(config: ConfigService) {
    this.clerkSecretKey = config.get<string>('CLERK_SECRET_KEY', '');
  }

  private async clerkFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`https://api.clerk.com/v1${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.clerkSecretKey}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.warn(`Clerk API ${path} returned ${res.status}: ${body}`);
      throw new BadRequestException('Provider operation failed');
    }
    return res.json() as Promise<T>;
  }

  async listProviders(authUserId: string): Promise<ProviderStatus[]> {
    if (!this.clerkSecretKey) {
      return SUPPORTED_PROVIDERS.map((p) => ({
        provider: p,
        connected: false,
        email: null,
      }));
    }

    const user = await this.clerkFetch<ClerkUser>(`/users/${authUserId}`);
    const linked = new Map(
      user.external_accounts
        .filter((a) => a.verification?.status === 'verified')
        .map((a) => [a.provider, a.email_address]),
    );

    return SUPPORTED_PROVIDERS.map((p) => ({
      provider: p,
      connected: linked.has(p),
      email: linked.get(p) ?? null,
    }));
  }

  async connectProvider(
    authUserId: string,
    provider: string,
  ): Promise<{ redirectUrl: string }> {
    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
    return {
      redirectUrl: `/auth/sso-callback?provider=${provider}&action=connect`,
    };
  }

  async disconnectProvider(
    authUserId: string,
    provider: string,
  ): Promise<void> {
    if (!this.clerkSecretKey) {
      throw new BadRequestException('Provider management unavailable');
    }

    const user = await this.clerkFetch<ClerkUser>(`/users/${authUserId}`);
    const account = user.external_accounts.find(
      (a) =>
        a.provider === provider &&
        a.verification?.status === 'verified',
    );

    if (!account) {
      throw new BadRequestException('Provider not connected');
    }

    const totalMethods =
      user.external_accounts.filter(
        (a) => a.verification?.status === 'verified',
      ).length + (user.password_enabled ? 1 : 0);

    if (totalMethods <= 1) {
      throw new ForbiddenException(
        'Cannot disconnect last authentication method',
      );
    }

    await this.clerkFetch(
      `/users/${authUserId}/external_accounts/${account.id}`,
      { method: 'DELETE' },
    );
    this.logger.log(
      `Disconnected provider ${provider} for user ${authUserId}`,
    );
  }
}
