import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth';
import { PrismaService } from '../database';
import { StripeService } from './stripe/stripe.service';
import { StripeWebhookService } from './webhooks/stripe-webhook.service';

@Controller('billing')
export class StripeWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly webhookService: StripeWebhookService,
  ) {}

  @Post('webhook')
  @Public()
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<{ received: boolean }> {
    const payload = req.rawBody ?? Buffer.from('');
    const event = this.stripeService.constructWebhookEvent(payload, signature);

    await this.prisma.stripeWebhookEvent.upsert({
      where: { id: event.id },
      create: { id: event.id },
      update: {},
    });

    const existing = await this.prisma.stripeWebhookEvent.findUnique({
      where: { id: event.id },
    });
    if (existing?.processedAt) {
      return { received: true };
    }

    await this.webhookService.handleEvent(event);

    await this.prisma.stripeWebhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });
    return { received: true };
  }
}
