import { Module } from '@nestjs/common';
import { CredentialCryptoService } from '../data-sources/credential-crypto.service';
import { DeliveryService } from './delivery.service';
import { SlackWebhookAdapter } from './slack-webhook.adapter';

@Module({
  providers: [CredentialCryptoService, SlackWebhookAdapter, DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
