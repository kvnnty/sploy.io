import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeService } from './stripe/stripe.service';
import { StripeWebhookService } from './webhooks/stripe-webhook.service';
import { UsageService } from './usage/usage.service';
import { EntitlementsService } from './entitlements/entitlements.service';
import { BillingTeamAdminGuard } from './guards/billing-team-admin.guard';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [
    StripeService,
    BillingService,
    StripeWebhookService,
    UsageService,
    EntitlementsService,
    BillingTeamAdminGuard,
  ],
  exports: [
    StripeService,
    BillingService,
    UsageService,
    EntitlementsService,
  ],
})
export class BillingModule {}
