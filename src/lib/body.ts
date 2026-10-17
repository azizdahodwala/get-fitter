import type { BodyMetric } from '@/db/repo';
import { formatLength, formatWeight, lengthUnit, parseLength, parseWeight, toUnit, type Unit } from '@/lib/format';

export type MetricKey = 'weight_kg' | 'body_fat' | 'waist_cm' | 'chest_cm' | 'hips_cm' | 'arm_cm';
type Kind = 'weight' | 'percent' | 'length';

export const METRICS: { key: MetricKey; label: string; kind: Kind }[] = [
  { key: 'weight_kg', label: 'Weight', kind: 'weight' },
  { key: 'body_fat', label: 'Body fat', kind: 'percent' },
  { key: 'waist_cm', label: 'Waist', kind: 'length' },
  { key: 'chest_cm', label: 'Chest', kind: 'length' },
  { key: 'hips_cm', label: 'Hips', kind: 'length' },
  { key: 'arm_cm', label: 'Arms', kind: 'length' },
];

export function metricUnit(kind: Kind, unit: Unit) {
  return kind === 'weight' ? unit : kind === 'percent' ? '%' : lengthUnit(unit);
}

/** Stored value → text in the user's unit, without the unit suffix. */
export function metricText(value: number | null | undefined, kind: Kind, unit: Unit) {
  if (value == null) return '';
  if (kind === 'weight') return formatWeight(value, unit);
  if (kind === 'length') return formatLength(value, unit);
  return String(Math.round(value * 10) / 10);
}

export function formatMetric(value: number | null | undefined, kind: Kind, unit: Unit) {
  if (value == null) return '—';
  const u = metricUnit(kind, unit);
  return kind === 'percent' ? `${metricText(value, kind, unit)}%` : `${metricText(value, kind, unit)} ${u}`;
}

/** What the user typed (in their unit) → stored value (kg, %, cm). */
export function parseMetric(text: string, kind: Kind, unit: Unit): number | null {
  if (!text.trim()) return null;
  if (kind === 'weight') return parseWeight(text, unit);
  if (kind === 'length') return parseLength(text, unit);
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n < 100 ? n : null;
}

/** Number for charts, in the user's unit. */
export function metricNumber(value: number, kind: Kind, unit: Unit) {
  if (kind === 'weight') return toUnit(value, unit);
  if (kind === 'length') return parseFloat(formatLength(value, unit));
  return value;
}

/** Latest value per metric with the change since the previous reading of that metric. */
export function latestValues(entries: BodyMetric[]) {
  const out = {} as Record<MetricKey, { value: number; at: number; delta: number | null } | null>;
  for (const m of METRICS) {
    const withValue = entries.filter((e) => e[m.key] != null);
    const [latest, prev] = withValue;
    out[m.key] = latest
      ? { value: latest[m.key]!, at: latest.measured_at, delta: prev ? latest[m.key]! - prev[m.key]! : null }
      : null;
  }
  return out;
}

export function formatDelta(delta: number | null, kind: Kind, unit: Unit) {
  if (delta == null || Math.abs(delta) < 0.05) return null;
  const sign = delta > 0 ? '+' : '−';
  return `${sign}${formatMetric(Math.abs(delta), kind, unit)}`;
}
