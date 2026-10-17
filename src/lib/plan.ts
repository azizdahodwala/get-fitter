import type { SQLiteDatabase } from 'expo-sqlite';

import { programFor, type Level, type Program } from '@/data/programs';
import { countWorkoutsSince, lastRoutineDone, type RoutineSummary } from '@/db/repo';
import { startOfWeek } from '@/lib/format';

export type PlanStatus = {
  program: Program;
  /** The program's routines that still exist (the user may have deleted some). */
  routines: RoutineSummary[];
  next: RoutineSummary | null;
  doneThisWeek: number;
};

export function programRoutines(program: Program, all: RoutineSummary[]) {
  const byKey = new Map(all.filter((r) => r.starter_key).map((r) => [r.starter_key!, r]));
  const pick = (keys: string[]) => keys.map((k) => byKey.get(k)).filter((r): r is RoutineSummary => !!r);
  return { byKey, routines: pick(program.routines.map((r) => r.key)), rotation: pick(program.rotation) };
}

/** Where the user is in their level's plan: the next routine in rotation and this week's count. */
export async function getPlanStatus(
  db: SQLiteDatabase,
  level: Level | null,
  all: RoutineSummary[],
): Promise<PlanStatus | null> {
  const program = programFor(level);
  if (!program) return null;
  const { routines, rotation } = programRoutines(program, all);
  const lastId = await lastRoutineDone(db, rotation.map((r) => r.id));
  const index = rotation.findIndex((r) => r.id === lastId);
  return {
    program,
    routines,
    next: rotation.length ? rotation[(index + 1) % rotation.length] : null,
    doneThisWeek: await countWorkoutsSince(db, startOfWeek()),
  };
}
