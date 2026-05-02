import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { DataSource } from '../generated/prisma/client';
import { PrismaService } from '../database';
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
  ) {}

  async create(
    orgId: string,
    dto: CreateDataSourceDto,
  ): Promise<DataSourcePublic> {
    const encryptedCredential = this.crypto.encrypt(dto.password);
    const row = await this.prisma.dataSource.create({
      data: {
        orgId,
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

  async listForOrg(orgId: string): Promise<DataSourcePublic[]> {
    const rows = await this.prisma.dataSource.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => this.toPublic(r));
  }

  private toPublic(row: DataSource): DataSourcePublic {
    return {
      id: row.id,
      orgId: row.orgId,
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

  async delete(orgId: string, id: string): Promise<void> {
    const ds = await this.requireForOrg(orgId, id);
    await this.prisma.dataSource.delete({ where: { id: ds.id } });
  }

  async testConnection(orgId: string, id: string): Promise<{ ok: true }> {
    const ds = await this.requireForOrg(orgId, id);
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
    orgId: string,
    id: string,
    sql: string,
  ): Promise<{ rows: Record<string, unknown>[]; truncated: boolean }> {
    const ds = await this.requireForOrg(orgId, id);
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

  private async requireForOrg(orgId: string, id: string): Promise<DataSource> {
    const ds = await this.prisma.dataSource.findFirst({
      where: { id, orgId },
    });
    if (!ds) {
      throw new NotFoundException('Data source not found');
    }
    if (ds.orgId !== orgId) {
      throw new ForbiddenException();
    }
    return ds;
  }
}
