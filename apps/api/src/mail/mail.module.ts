import { Module } from '@nestjs/common';

import { MailService } from './mail.service';

/** Outbound mail (Resend) and shared template path helpers. */
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
