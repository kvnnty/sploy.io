import { Client } from 'pg';
import { Injectable, BadGatewayException } from '@nestjs/common';
import { assertSafeSelect, wrapSelectWithRowCap } from './sql-guard';

const DEFAULT_STATEMENT_MS = 30_000;
const DEFAULT_MAX_ROWS = 500;

export interface PgConnectionParams {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

@Injectable()
export class QueryExecutionService {
  async runReadOnlySelect(
    conn: PgConnectionParams,
    sql: string,
    opts?: {
      maxRows?: number;
      statementTimeoutMs?: number;
      searchPath?: string;
    },
  ): Promise<{ rows: Record<string, unknown>[]; truncated: boolean }> {
    const maxRows = opts?.maxRows ?? DEFAULT_MAX_ROWS;
    const statementTimeoutMs = opts?.statementTimeoutMs ?? DEFAULT_STATEMENT_MS;
    const safe = assertSafeSelect(sql);
    const wrapped = wrapSelectWithRowCap(safe, maxRows);

    const client = new Client({
      host: conn.host,
      port: conn.port,
      database: conn.database,
      user: conn.user,
      password: conn.password,
    });

    try {
      await client.connect();
      await client.query(
        `SET statement_timeout = ${Math.floor(statementTimeoutMs)}`,
      );
      if (opts?.searchPath) {
        await client.query(
          `SET search_path TO ${opts.searchPath.replace(/[^a-z0-9_]/gi, '')}`,
        );
      }
      const result = await client.query(wrapped);
      const rawRows = result.rows as Record<string, unknown>[];
      const truncated = rawRows.length > maxRows;
      const rows = truncated ? rawRows.slice(0, maxRows) : rawRows;
      return { rows, truncated };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadGatewayException(`Query failed: ${message}`);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  async ping(conn: PgConnectionParams): Promise<void> {
    const client = new Client({
      host: conn.host,
      port: conn.port,
      database: conn.database,
      user: conn.user,
      password: conn.password,
      connectionTimeoutMillis: 10_000,
    });
    try {
      await client.connect();
      await client.query('SELECT 1');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadGatewayException(`Connection test failed: ${message}`);
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}
