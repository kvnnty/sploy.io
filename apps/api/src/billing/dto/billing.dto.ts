import { BillingPlan } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class CheckoutSessionDto {
  @IsUUID()
  teamId!: string;

  @IsEnum(BillingPlan)
  plan!: BillingPlan;
}

export class PortalSessionDto {
  @IsUUID()
  teamId!: string;
}
