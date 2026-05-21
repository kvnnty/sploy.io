import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { CredentialCryptoService } from '../data-sources/credential-crypto.service';
import type { DeliveryAdapter, DeliveryPayload } from './delivery.types';

@Injectable()
export class SlackWebhookAdapter implements DeliveryAdapter {
  private readonly logger = new Logger(SlackWebhookAdapter.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CredentialCryptoService,
  ) {}

  async send(teamId: string, payload: DeliveryPayload): Promise<void> {
    const integration = await this.prisma.teamIntegration.findUnique({
      where: { teamId },
    });
    const enc = integration?.slackWebhookUrlEnc;
    if (!enc) {
      throw new BadRequestException(
        'Slack webhook is not configured for this team',
      );
    }

    const webhookUrl = this.crypto.decrypt(enc);
    const driverLines = payload.drivers
      .slice(0, 3)
      .map((d, i) => `${i + 1}. *${d.headline}*${d.detail ? ` — ${d.detail}` : ''}`)
      .join('\n');

    const blocks: Record<string, unknown>[] = [
      {
        type: 'header',
        text: { type: 'plain_text', text: payload.title.slice(0, 150) },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: payload.body.slice(0, 2900) },
      },
    ];

    if (driverLines) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `*Drivers*\n${driverLines}` },
      });
    }

    if (payload.reportUrl) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View analysis' },
            url: payload.reportUrl,
          },
        ],
      });
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`Slack webhook failed: ${res.status} ${text.slice(0, 200)}`);
      throw new BadRequestException(
        `Slack delivery failed (${res.status}). Check your webhook URL.`,
      );
    }
  }
}
