import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private client: Stripe | null = null;

  constructor(private readonly config: ConfigService) {}

  getStripe(): Stripe {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) {
      throw new ServiceUnavailableException(
        'Stripe is not configured (STRIPE_SECRET_KEY)',
      );
    }
    if (!this.client) {
      this.client = new Stripe(key, { typescript: true });
    }
    return this.client;
  }

  assertConfigured(): void {
    this.getStripe();
  }

  constructWebhookEvent(
    payload: Buffer | string,
    signature: string | string[] | undefined,
  ) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET missing');
      throw new ServiceUnavailableException('Webhook not configured');
    }
    if (!signature || typeof signature !== 'string') {
      throw new Error('Missing stripe-signature header');
    }
    return this.getStripe().webhooks.constructEvent(payload, signature, secret);
  }

}
