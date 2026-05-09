import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { DataSource } from '@prisma/client';
import { PrismaService } from '../database';
import { EntitlementsService } from '../billing/entitlements/entitlements.service';
import { CredentialCryptoService } from './credential-crypto.service';
import { QueryExecutionService } from '../query/query-execution.service';
import type { CreateDataSourceDto } from './dto/data-sources.dto';

type DataSourcePublic = Omit<DataSource, 'encryptedCredential'>;

@Injectable()
export class DataSourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CredentialCryptoService,
    private readonly queryExecution: QueryExecutionService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async create(
    teamId: string,
    dto: CreateDataSourceDto,
  ): Promise<DataSourcePublic> {
    await this.entitlements.assertCanAddConnector(teamId);
    const encryptedCredential = this.crypto.encrypt(dto.password);
    const row = await this.prisma.dataSource.create({
      data: {
        teamId,
        name: dto.name,
        host: dto.host,
        port: dto.port,
        database: dto.database,
        username: dto.username,
        encryptedCredential,
      },
    });
    return this.toPublic(row);
  }

  async listForTeam(teamId: string): Promise<DataSourcePublic[]> {
    const rows = await this.prisma.dataSource.findMany({
      where: { teamId },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => this.toPublic(r));
  }

  private toPublic(row: DataSource): DataSourcePublic {
    return {
      id: row.id,
      teamId: row.teamId,
      name: row.name,
      kind: row.kind,
      host: row.host,
      port: row.port,
      database: row.database,
      username: row.username,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async delete(teamId: string, id: string): Promise<void> {
    const ds = await this.requireForTeam(teamId, id);
    await this.prisma.dataSource.delete({ where: { id: ds.id } });
  }

  async testConnection(teamId: string, id: string): Promise<{ ok: true }> {
    const ds = await this.requireForTeam(teamId, id);
    const password = this.crypto.decrypt(ds.encryptedCredential);
    await this.queryExecution.ping({
      host: ds.host,
      port: ds.port,
      database: ds.database,
      user: ds.username,
      password,
    });
    return { ok: true };
  }

  async runQuery(
    teamId: string,
    id: string,
    sql: string,
  ): Promise<{ rows: Record<string, unknown>[]; truncated: boolean }> {
    const ds = await this.requireForTeam(teamId, id);
    const password = this.crypto.decrypt(ds.encryptedCredential);
    return this.queryExecution.runReadOnlySelect(
      {
        host: ds.host,
        port: ds.port,
        database: ds.database,
        user: ds.username,
        password,
      },
      sql,
    );
  }

  private async requireForTeam(teamId: string, id: string): Promise<DataSource> {
    const ds = await this.prisma.dataSource.findFirst({
      where: { id, teamId },
    });
    if (!ds) {
      throw new NotFoundException('Data source not found');
    }
    if (ds.teamId !== teamId) {
      throw new ForbiddenException();
    }
    return ds;
  }
}
