import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TeamRole } from '@prisma/client';
import { Roles } from '../auth';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { AnalysisRunsService } from './analysis-runs.service';
import { DecisionActionsService } from './decision-actions.service';
import { CreateActionDto, SaveSlackWebhookDto } from './dto/analysis.dto';
import { IntegrationsService } from '../integrations/integrations.service';

@Controller('teams/:teamId')
@UseGuards(TeamMemberGuard)
export class AnalysisController {
  constructor(
    private readonly analysisRuns: AnalysisRunsService,
    private readonly actions: DecisionActionsService,
    private readonly integrations: IntegrationsService,
  ) {}

  @Get('analysis-runs')
  listRuns(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.analysisRuns.listForTeam(teamId);
  }

  @Get('analysis-runs/:runId')
  getRun(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('runId', ParseUUIDPipe) runId: string,
  ) {
    return this.analysisRuns.getForTeam(teamId, runId);
  }

  @Post('actions')
  createAction(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: CreateActionDto,
  ) {
    return this.actions.createFromRun(teamId, dto.analysisRunId, {
      title: dto.title,
      body: dto.body,
    });
  }

  @Post('actions/:actionId/approve')
  approveAction(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('actionId', ParseUUIDPipe) actionId: string,
  ) {
    return this.actions.approve(teamId, actionId);
  }

  @Post('actions/:actionId/send')
  sendAction(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('actionId', ParseUUIDPipe) actionId: string,
  ) {
    return this.actions.send(teamId, actionId);
  }

  @Get('integrations/slack')
  slackStatus(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.integrations.getSlackStatus(teamId);
  }

  @Put('integrations/slack')
  @Roles(TeamRole.owner, TeamRole.admin)
  saveSlack(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: SaveSlackWebhookDto,
  ) {
    return this.integrations.saveSlackWebhook(teamId, dto.webhookUrl);
  }

  @Post('integrations/slack/test')
  @Roles(TeamRole.owner, TeamRole.admin)
  async testSlack(@Param('teamId', ParseUUIDPipe) teamId: string) {
    await this.integrations.testSlackWebhook(teamId);
    return { ok: true };
  }
}
