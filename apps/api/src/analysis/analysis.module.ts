import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { IntegrationsService } from '../integrations/integrations.service';
import { AnalysisAskService } from './analysis-ask.service';
import { AnalysisController } from './analysis.controller';
import { AnalysisRunsService } from './analysis-runs.service';
import { DecisionActionsService } from './decision-actions.service';

@Module({
  imports: [AuthModule, BillingModule, DeliveryModule],
  controllers: [AnalysisController],
  providers: [
    AnalysisRunsService,
    AnalysisAskService,
    DecisionActionsService,
    IntegrationsService,
  ],
  exports: [AnalysisAskService, AnalysisRunsService],
})
export class AnalysisModule {}
