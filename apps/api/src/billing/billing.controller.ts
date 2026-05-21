import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth';
import { BillingService } from './billing.service';
import { CheckoutSessionDto, PortalSessionDto } from './dto/billing.dto';
import { BillingTeamAdminGuard } from './guards/billing-team-admin.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('checkout-session')
  @UseGuards(BillingTeamAdminGuard)
  createCheckout(
    @CurrentUser() user: AuthUser,
    @Body() dto: CheckoutSessionDto,
  ) {
    return this.billing.createCheckoutSession({
      teamId: dto.teamId,
      plan: dto.plan,
      billingEmail: user.email?.trim() || undefined,
    });
  }

  @Post('portal-session')
  @UseGuards(BillingTeamAdminGuard)
  createPortal(@Body() dto: PortalSessionDto) {
    return this.billing.createPortalSession(dto.teamId);
  }

  @Get('status/:teamId')
  @UseGuards(TeamMemberGuard)
  getStatus(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.billing.getStatus(teamId);
  }

  @Get('invoices/:teamId')
  @UseGuards(TeamMemberGuard)
  listInvoices(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.billing.listInvoices(teamId);
  }
}
