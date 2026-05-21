export type ChartPoint = { x: string; y: number };

export type ChartSpec = {
  type: 'line' | 'bar';
  xKey: string;
  yKey: string;
  points: ChartPoint[];
};

const DATE_LIKE = /date|time|day|month|year|week|created|updated|at$/i;
const NUMERIC_TYPES = /int|float|numeric|decimal|double|real|number/i;

function isDateLikeColumn(name: string, sample: unknown): boolean {
  if (DATE_LIKE.test(name)) return true;
  if (sample instanceof Date) return true;
  if (typeof sample === 'string') {
    const t = Date.parse(sample);
    return !Number.isNaN(t) && sample.length >= 8;
  }
  return false;
}

function isNumericValue(v: unknown): boolean {
  if (typeof v === 'number' && Number.isFinite(v)) return true;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) {
    return true;
  }
  return false;
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  return Number(v);
}

function toXLabel(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (v === null || v === undefined) return '';
  return String(v);
}

export function buildChartSpec(
  rows: Record<string, unknown>[],
): ChartSpec | null {
  if (rows.length < 2) return null;

  const first = rows[0];
  const keys = Object.keys(first);
  if (keys.length < 2) return null;

  let xKey: string | null = null;
  let yKey: string | null = null;

  for (const key of keys) {
    if (!xKey && isDateLikeColumn(key, first[key])) {
      xKey = key;
      continue;
    }
    if (!yKey && isNumericValue(first[key])) {
      yKey = key;
    }
  }

  if (!xKey) {
    const stringKey = keys.find((k) => typeof first[k] === 'string');
    if (stringKey) xKey = stringKey;
  }

  if (!yKey) {
    for (const key of keys) {
      if (key === xKey) continue;
      if (rows.some((r) => isNumericValue(r[key]))) {
        yKey = key;
        break;
      }
    }
  }

  if (!xKey || !yKey || xKey === yKey) return null;

  const points: ChartPoint[] = [];
  for (const row of rows.slice(0, 50)) {
    const x = toXLabel(row[xKey]);
    const y = toNumber(row[yKey]);
    if (!x || !Number.isFinite(y)) continue;
    points.push({ x, y });
  }

  if (points.length < 2) return null;

  return {
    type: isDateLikeColumn(xKey, first[xKey]) ? 'line' : 'bar',
    xKey,
    yKey,
    points,
  };
}
