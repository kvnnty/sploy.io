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

  /**
   * Metered billing reporting (legacy usage records API).
   * Not all Stripe typings expose this; call the REST endpoint directly.
   */
  async createUsageRecord(
    subscriptionItemId: string,
    quantity: number,
  ): Promise<void> {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) {
      throw new ServiceUnavailableException('STRIPE_SECRET_KEY missing');
    }
    const form = new URLSearchParams();
    form.set('quantity', String(quantity));
    form.set('timestamp', String(Math.floor(Date.now() / 1000)));
    form.set('action', 'increment');
    const res = await fetch(
      `https://api.stripe.com/v1/subscription_items/${encodeURIComponent(subscriptionItemId)}/usage_records`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stripe usage record failed: ${res.status} ${text.slice(0, 500)}`);
    }
  }
}
