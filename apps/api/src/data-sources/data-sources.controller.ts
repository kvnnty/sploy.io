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
import { OrgRole } from '@prisma/client';
import { OrgMemberGuard } from '../auth/guards/org-member.guard';
import { Roles } from '../auth';
import { DataSourcesService } from './data-sources.service';
import {
  AskDto,
  CreateDataSourceDto,
  RunQueryDto,
} from './dto/data-sources.dto';
import { NlSqlService } from '../query/nl-sql.service';

@Controller('orgs/:orgId/data-sources')
@UseGuards(OrgMemberGuard)
export class DataSourcesController {
  constructor(
    private readonly dataSources: DataSourcesService,
    private readonly nlSql: NlSqlService,
  ) {}

  @Post()
  @Roles(OrgRole.owner, OrgRole.admin)
  create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateDataSourceDto,
  ) {
    return this.dataSources.create(orgId, dto);
  }

  @Get()
  list(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.dataSources.listForOrg(orgId);
  }

  @Delete(':dataSourceId')
  @Roles(OrgRole.owner, OrgRole.admin)
  remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
  ) {
    return this.dataSources.delete(orgId, dataSourceId);
  }

  @Post(':dataSourceId/test')
  test(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
  ) {
    return this.dataSources.testConnection(orgId, dataSourceId);
  }

  @Post(':dataSourceId/query')
  runQuery(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
    @Body() dto: RunQueryDto,
  ) {
    return this.dataSources.runQuery(orgId, dataSourceId, dto.sql);
  }

  @Post(':dataSourceId/ask')
  async ask(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
    @Body() dto: AskDto,
  ) {
    const sql =
      dto.sql?.trim() ||
      (await this.nlSql.questionToSelectSql(dto.question, dto.schemaHint));
    const result = await this.dataSources.runQuery(orgId, dataSourceId, sql);
    return { sql, ...result };
  }
}
