import {
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
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { Roles } from '../auth';
import { DataSourcesService } from './data-sources.service';
import {
  AskDto,
  CreateDataSourceDto,
  RunQueryDto,
} from './dto/data-sources.dto';
import { AnalysisBriefService } from '../query/analysis-brief.service';
import { NlSqlService } from '../query/nl-sql.service';

@Controller('teams/:teamId/data-sources')
@UseGuards(TeamMemberGuard)
export class DataSourcesController {
  constructor(
    private readonly dataSources: DataSourcesService,
    private readonly nlSql: NlSqlService,
    private readonly analysisBrief: AnalysisBriefService,
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
  ) {
    const sql =
      dto.sql?.trim() ||
      (await this.nlSql.questionToSelectSql(dto.question, dto.schemaHint));
    const result = await this.dataSources.runQuery(teamId, dataSourceId, sql);
    const brief = await this.analysisBrief.summarize({
      question: dto.question,
      sql,
      rows: result.rows,
      truncated: result.truncated,
    });
    return { sql, ...result, brief: brief ?? undefined };
  }
}
