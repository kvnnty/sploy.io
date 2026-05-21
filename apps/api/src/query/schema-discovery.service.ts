import { Injectable } from '@nestjs/common';
import { QueryExecutionService, type PgConnectionParams } from './query-execution.service';

export type SchemaColumn = { name: string; type: string };
export type SchemaTable = { name: string; columns: SchemaColumn[] };
export type DataSourceSchema = { tables: SchemaTable[] };

const SCHEMA_SQL = `
SELECT
  c.table_schema AS table_schema,
  c.table_name AS table_name,
  c.column_name AS column_name,
  c.data_type AS data_type
FROM information_schema.columns c
WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND c.table_schema NOT LIKE 'pg_%'
ORDER BY c.table_schema, c.table_name, c.ordinal_position
LIMIT 2000
`;

@Injectable()
export class SchemaDiscoveryService {
  constructor(private readonly queryExecution: QueryExecutionService) {}

  async discover(conn: PgConnectionParams): Promise<DataSourceSchema> {
    const { rows } = await this.queryExecution.runReadOnlySelect(
      conn,
      SCHEMA_SQL,
      { maxRows: 2000 },
    );

    const byTable = new Map<string, SchemaTable>();

    for (const row of rows) {
      const schema = String(row.table_schema ?? 'public');
      const tableName = String(row.table_name ?? '');
      const key = schema === 'public' ? tableName : `${schema}.${tableName}`;
      if (!key) continue;

      let table = byTable.get(key);
      if (!table) {
        table = { name: key, columns: [] };
        byTable.set(key, table);
      }
      if (table.columns.length >= 40) continue;

      table.columns.push({
        name: String(row.column_name ?? ''),
        type: String(row.data_type ?? ''),
      });
    }

    const tables = [...byTable.values()].slice(0, 50);
    return { tables };
  }

  formatSchemaHint(schema: DataSourceSchema, maxChars = 12_000): string {
    const lines: string[] = [];
    for (const table of schema.tables) {
      const cols = table.columns
        .map((c) => `${c.name} (${c.type})`)
        .join(', ');
      lines.push(`Table ${table.name}: ${cols}`);
      if (lines.join('\n').length > maxChars) break;
    }
    const text = lines.join('\n');
    return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
  }
}
