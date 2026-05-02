import { BadRequestException } from '@nestjs/common';

const FORBIDDEN =
  /\b(insert|update|delete|drop|truncate|alter|create|grant|revoke|copy|call|execute|prepare|deallocate|listen|notify|load|cluster|vacuum|analyze|refresh|reindex|merge)\b/i;

export function assertSafeSelect(sql: string): string {
  const trimmed = sql.trim();
  if (!trimmed) {
    throw new BadRequestException('SQL is empty');
  }
  if (/^\s*--|^\s*\/\*/.test(trimmed)) {
    throw new BadRequestException('Remove leading SQL comments');
  }
  const withoutTrailingSemi = trimmed.replace(/;+\s*$/u, '').trim();
  if (withoutTrailingSemi.includes(';')) {
    throw new BadRequestException('Only one SQL statement is allowed');
  }
  if (!/^select\b/is.test(withoutTrailingSemi)) {
    throw new BadRequestException('Only SELECT queries are allowed');
  }
  if (FORBIDDEN.test(withoutTrailingSemi)) {
    throw new BadRequestException('Query contains forbidden keywords');
  }
  return withoutTrailingSemi;
}

export function wrapSelectWithRowCap(
  innerSql: string,
  maxRows: number,
): string {
  return `SELECT * FROM (${innerSql}) AS _sploy_sub LIMIT ${maxRows + 1}`;
}
