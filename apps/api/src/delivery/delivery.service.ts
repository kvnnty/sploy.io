import { Injectable } from '@nestjs/common';
import { SlackWebhookAdapter } from './slack-webhook.adapter';
import type { DeliveryAdapter, DeliveryPayload } from './delivery.types';

@Injectable()
export class DeliveryService {
  constructor(private readonly slack: SlackWebhookAdapter) {}

  async sendViaSlack(teamId: string, payload: DeliveryPayload): Promise<void> {
    return this.getSlackAdapter().send(teamId, payload);
  }

  /** Swap implementation when OAuth Slack app ships. */
  getSlackAdapter(): DeliveryAdapter {
    return this.slack;
  }
}
