import type { TrackingMode } from '@/data/catalog';
import type { SetValues } from '@/db/repo';

export type Unit = 'kg' | 'lb';

const LB_PER_KG = 2.2046226218;

/** Weight in the user's unit, rounded for display (0.01 kg / 0.1 lb). */
export function toUnit(kg: number, unit: Unit) {
  return unit === 'kg' ? Math.round(kg * 100) / 100 : Math.round(kg * LB_PER_KG * 10) / 10;
}

export function formatWeight(kg: number | null | undefined, unit: Unit) {
  if (kg == null) return '';
  return String(toUnit(kg, unit));
}

/** Parses what the user typed (in their unit) into kilograms. */
export function parseWeight(text: string, unit: Unit): number | null {
  const n = parseFloat(text.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return unit === 'kg' ? n : n / LB_PER_KG;
}

export function parseCount(text: string): number | null {
  const n = parseInt(text, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Accepts "45", "1:30" or "1:02:00". */
export function parseDuration(text: string): number | null {
  const parts = text.trim().split(':').map((p) => parseInt(p, 10));
  if (!parts.length || parts.some((p) => !Number.isFinite(p) || p < 0)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** "1h 05m" / "42m" for workout lengths. */
export function formatSpan(ms: number) {
  const mins = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  return h ? `${h}h ${String(mins % 60).padStart(2, '0')}m` : `${mins}m`;
}

export function formatVolume(kg: number, unit: Unit) {
  return `${Math.round(toUnit(kg, unit)).toLocaleString()} ${unit}`;
}

export function formatSet(s: SetValues, mode: TrackingMode, unit: Unit) {
  if (mode === 'time') return s.seconds != null ? formatDuration(s.seconds) : '—';
  if (mode === 'reps' || s.weight_kg == null) return s.reps != null ? `${s.reps} reps` : '—';
  return `${formatWeight(s.weight_kg, unit)} ${unit} × ${s.reps ?? '—'}`;
}

// Body measurements are stored in cm and shown in inches for lb users.
const CM_PER_IN = 2.54;

export function lengthUnit(unit: Unit) {
  return unit === 'kg' ? 'cm' : 'in';
}

export function formatLength(cm: number | null | undefined, unit: Unit) {
  if (cm == null) return '';
  return String(unit === 'kg' ? Math.round(cm * 10) / 10 : Math.round((cm / CM_PER_IN) * 10) / 10);
}

export function parseLength(text: string, unit: Unit): number | null {
  const n = parseFloat(text.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return unit === 'kg' ? n : n * CM_PER_IN;
}

export function formatHeight(cm: number | null | undefined, unit: Unit) {
  if (!cm) return '—';
  if (unit === 'kg') return `${Math.round(cm)} cm`;
  const totalIn = Math.round(cm / CM_PER_IN);
  return `${Math.floor(totalIn / 12)}′${totalIn % 12}″`;
}

export function feetInchesToCm(feet: number, inches: number) {
  return (feet * 12 + inches) * CM_PER_IN;
}

export function cmToFeetInches(cm: number) {
  const totalIn = Math.round(cm / CM_PER_IN);
  return { feet: Math.floor(totalIn / 12), inches: totalIn % 12 };
}

export function bmi(weightKg: number | null | undefined, heightCm: number | null | undefined) {
  if (!weightKg || !heightCm) return null;
  return Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10;
}

/** Midnight on the Monday of the week containing `d`. */
export function startOfWeek(d = new Date()) {
  const day = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day).getTime();
}

/** Estimated one-rep max (Epley). */
export function estimate1RM(kg: number, reps: number) {
  return reps <= 1 ? kg : kg * (1 + reps / 30);
}

export function formatDate(ms: number, opts: Intl.DateTimeFormatOptions = {}) {
  return new Date(ms).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', ...opts });
}

export function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
