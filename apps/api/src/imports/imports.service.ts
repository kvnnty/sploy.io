import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parse } from 'csv-parse/sync';
import { Client } from 'pg';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../database';
import { EntitlementsService } from '../billing/entitlements/entitlements.service';
import {
  QueryExecutionService,
  type PgConnectionParams,
} from '../query/query-execution.service';

const MAX_ROWS = 10_000;
const MAX_COLS = 50;

export type TeamImportPublic = {
  id: string;
  teamId: string;
  name: string;
  tableName: string;
  columns: { name: string; original: string }[];
  rowCount: number;
  createdAt: Date;
};

@Injectable()
export class ImportsService implements OnModuleInit {
  private appDbUrl!: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly entitlements: EntitlementsService,
    private readonly queryExecution: QueryExecutionService,
  ) {}

  onModuleInit() {
    const url =
      this.config.get<string>('DATASET_DATABASE_URL') ||
      this.config.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error('DATABASE_URL is required for imports');
    }
    this.appDbUrl = url;
  }

  async listForTeam(teamId: string): Promise<TeamImportPublic[]> {
    const rows = await this.prisma.teamImport.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toPublic(r));
  }

  async requireForTeam(teamId: string, id: string) {
    const row = await this.prisma.teamImport.findFirst({
      where: { id, teamId },
    });
    if (!row) throw new NotFoundException('Import not found');
    return row;
  }

  async importCsv(
    teamId: string,
    name: string,
    fileBuffer: Buffer,
  ): Promise<TeamImportPublic> {
    await this.entitlements.assertCanAddConnector(teamId);

    const text = fileBuffer.toString('utf8');
    if (!text.trim()) {
      throw new BadRequestException('CSV file is empty');
    }

    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    if (!records.length) {
      throw new BadRequestException('CSV has no data rows');
    }
    if (records.length > MAX_ROWS) {
      throw new BadRequestException(
        `CSV exceeds maximum of ${MAX_ROWS} rows`,
      );
    }

    const originalHeaders = Object.keys(records[0]);
    if (originalHeaders.length > MAX_COLS) {
      throw new BadRequestException(
        `CSV exceeds maximum of ${MAX_COLS} columns`,
      );
    }

    const columns = originalHeaders.map((h, i) => ({
      original: h,
      name: this.sanitizeIdentifier(h, `col_${i + 1}`),
    }));

    const tableName = `ti_${randomBytes(4).toString('hex')}`;
    const colDefs = columns
      .map((c) => `"${c.name}" TEXT`)
      .join(', ');

    const client = new Client({ connectionString: this.appDbUrl });
    await client.connect();

    try {
      await client.query('CREATE SCHEMA IF NOT EXISTS team_imports');
      await client.query(
        `CREATE TABLE team_imports."${tableName}" (${colDefs})`,
      );

      const colNames = columns.map((c) => `"${c.name}"`).join(', ');
      const batchSize = 200;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const values: string[] = [];
        const params: string[] = [];
        let param = 1;

        for (const row of batch) {
          const placeholders = columns.map(() => `$${param++}`).join(', ');
          values.push(`(${placeholders})`);
          for (const col of columns) {
            params.push(row[col.original] ?? '');
          }
        }

        await client.query(
          `INSERT INTO team_imports."${tableName}" (${colNames}) VALUES ${values.join(', ')}`,
          params,
        );
      }
    } finally {
      await client.end().catch(() => undefined);
    }

    const row = await this.prisma.teamImport.create({
      data: {
        teamId,
        name: name.trim() || 'CSV import',
        tableName,
        columns,
        rowCount: records.length,
      },
    });

    return this.toPublic(row);
  }

  async runQueryOnImport(
    teamId: string,
    importId: string,
    sql: string,
  ): Promise<{ rows: Record<string, unknown>[]; truncated: boolean }> {
    await this.requireForTeam(teamId, importId);
    return this.queryExecution.runReadOnlySelect(
      this.getAppConnectionParams(),
      sql,
      { searchPath: 'team_imports' },
    );
  }

  getAppConnectionParams(): PgConnectionParams {
    const url = new URL(this.appDbUrl);
    return {
      host: url.hostname,
      port: Number(url.port || 5432),
      database: url.pathname.replace(/^\//, '') || 'postgres',
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  }

  formatSchemaHint(imp: {
    tableName: string;
    columns: unknown;
  }): string {
    const cols = Array.isArray(imp.columns)
      ? (imp.columns as { name: string; original?: string }[])
      : [];
    const colList = cols.map((c) => c.name).join(', ');
    return `Table ${imp.tableName} (schema team_imports): columns ${colList}`;
  }

  private sanitizeIdentifier(raw: string, fallback: string): string {
    const base = raw
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48);
    const name = base || fallback;
    if (!/^[a-z]/.test(name)) return `c_${name}`;
    return name;
  }

  private toPublic(row: {
    id: string;
    teamId: string;
    name: string;
    tableName: string;
    columns: unknown;
    rowCount: number;
    createdAt: Date;
  }): TeamImportPublic {
    return {
      id: row.id,
      teamId: row.teamId,
      name: row.name,
      tableName: row.tableName,
      columns: Array.isArray(row.columns)
        ? (row.columns as TeamImportPublic['columns'])
        : [],
      rowCount: row.rowCount,
      createdAt: row.createdAt,
    };
  }
}
