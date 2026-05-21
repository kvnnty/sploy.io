import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { CredentialCryptoService } from './credential-crypto.service';
import { DataSourcesController } from './data-sources.controller';
import { DataSourcesService } from './data-sources.service';

@Module({
  imports: [AuthModule, BillingModule, AnalysisModule],
  controllers: [DataSourcesController],
  providers: [CredentialCryptoService, DataSourcesService],
  exports: [CredentialCryptoService, DataSourcesService],
})
export class DataSourcesModule {}
