import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database';
import { CredentialCryptoService } from '../data-sources/credential-crypto.service';
import { DeliveryService } from '../delivery/delivery.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CredentialCryptoService,
    private readonly delivery: DeliveryService,
  ) {}

  async getSlackStatus(teamId: string): Promise<{ configured: boolean }> {
    const row = await this.prisma.teamIntegration.findUnique({
      where: { teamId },
    });
    return { configured: Boolean(row?.slackWebhookUrlEnc) };
  }

  async saveSlackWebhook(teamId: string, webhookUrl: string): Promise<void> {
    const trimmed = webhookUrl.trim();
    if (!trimmed.startsWith('https://hooks.slack.com/')) {
      throw new BadRequestException(
        'URL must be a Slack incoming webhook (https://hooks.slack.com/...)',
      );
    }
    const enc = this.crypto.encrypt(trimmed);
    await this.prisma.teamIntegration.upsert({
      where: { teamId },
      create: { teamId, slackWebhookUrlEnc: enc },
      update: { slackWebhookUrlEnc: enc },
    });
  }

  async testSlackWebhook(teamId: string): Promise<void> {
    await this.delivery.sendViaSlack(teamId, {
      title: 'Sploy test message',
      body: 'Your Slack webhook is configured correctly. Decision briefs will be delivered here after approval.',
      drivers: [],
    });
  }
}
