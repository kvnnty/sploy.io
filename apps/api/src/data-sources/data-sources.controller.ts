import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TeamRole } from '@prisma/client';
import { CurrentUser, Roles, type AuthUser } from '../auth';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { AnalysisAskService } from '../analysis/analysis-ask.service';
import { DataSourcesService } from './data-sources.service';
import {
  AskDto,
  CreateDataSourceDto,
  RunQueryDto,
} from './dto/data-sources.dto';
import { SchemaDiscoveryService } from '../query/schema-discovery.service';

@Controller('teams/:teamId/data-sources')
@UseGuards(TeamMemberGuard)
export class DataSourcesController {
  constructor(
    private readonly dataSources: DataSourcesService,
    private readonly analysisAsk: AnalysisAskService,
    private readonly schemaDiscovery: SchemaDiscoveryService,
  ) {}

  @Post()
  @Roles(TeamRole.owner, TeamRole.admin)
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: CreateDataSourceDto,
  ) {
    return this.dataSources.create(teamId, dto);
  }

  @Get()
  list(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.dataSources.listForTeam(teamId);
  }

  @Delete(':dataSourceId')
  @Roles(TeamRole.owner, TeamRole.admin)
  remove(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
  ) {
    return this.dataSources.delete(teamId, dataSourceId);
  }

  @Post(':dataSourceId/test')
  test(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
  ) {
    return this.dataSources.testConnection(teamId, dataSourceId);
  }

  @Get(':dataSourceId/schema')
  async schema(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
  ) {
    const conn = await this.dataSources.getConnectionParams(teamId, dataSourceId);
    return this.schemaDiscovery.discover(conn);
  }

  @Post(':dataSourceId/query')
  runQuery(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
    @Body() dto: RunQueryDto,
  ) {
    return this.dataSources.runQuery(teamId, dataSourceId, dto.sql);
  }

  @Post(':dataSourceId/ask')
  async ask(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
    @Body() dto: AskDto,
    @CurrentUser() user: AuthUser,
  ) {
    const userId = user.internalUserId;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }

    let schemaHint = dto.schemaHint?.trim();
    let schemaUsed = Boolean(schemaHint);

    if (!schemaHint && !dto.sql?.trim()) {
      const conn = await this.dataSources.getConnectionParams(
        teamId,
        dataSourceId,
      );
      const discovered = await this.schemaDiscovery.discover(conn);
      schemaHint = this.schemaDiscovery.formatSchemaHint(discovered);
      schemaUsed = true;
    }

    return this.analysisAsk.completeAsk({
      teamId,
      userId,
      dataSourceId,
      question: dto.question,
      schemaHint,
      sql: dto.sql,
      schemaUsed,
      runQuery: (sql) => this.dataSources.runQuery(teamId, dataSourceId, sql),
    });
  }
}
