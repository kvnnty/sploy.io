import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeamRole } from '@prisma/client';
import { CurrentUser, Roles, type AuthUser } from '../auth';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { AnalysisAskService } from '../analysis/analysis-ask.service';
import { AskImportDto } from '../analysis/dto/analysis.dto';
import { ImportsService } from './imports.service';

@Controller('teams/:teamId/imports')
@UseGuards(TeamMemberGuard)
export class ImportsController {
  constructor(
    private readonly imports: ImportsService,
    private readonly analysisAsk: AnalysisAskService,
  ) {}

  @Get()
  list(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.imports.listForTeam(teamId);
  }

  @Post()
  @Roles(TeamRole.owner, TeamRole.admin)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('CSV file is required');
    }
    const mime = file.mimetype?.toLowerCase() ?? '';
    const fname = file.originalname?.toLowerCase() ?? '';
    if (
      !mime.includes('csv') &&
      !fname.endsWith('.csv') &&
      mime !== 'text/plain'
    ) {
      throw new BadRequestException('Only CSV files are supported today');
    }
    return this.imports.importCsv(teamId, name ?? file.originalname ?? 'Import', file.buffer);
  }

  @Post(':importId/ask')
  async ask(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('importId', ParseUUIDPipe) importId: string,
    @Body() dto: AskImportDto,
    @CurrentUser() user: AuthUser,
  ) {
    const userId = user.internalUserId;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }

    const imp = await this.imports.requireForTeam(teamId, importId);
    const schemaHint =
      dto.schemaHint?.trim() || this.imports.formatSchemaHint(imp);

    return this.analysisAsk.completeAsk({
      teamId,
      userId,
      importId,
      question: dto.question,
      schemaHint,
      sql: dto.sql,
      schemaUsed: true,
      runQuery: (sql) => this.imports.runQueryOnImport(teamId, importId, sql),
    });
  }
}
