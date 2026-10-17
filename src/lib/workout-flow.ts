import { router } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';

import { deleteWorkout, getActiveWorkout, startWorkout } from '@/db/repo';
import { confirm } from '@/lib/dialogs';

export function openWorkout(id: number) {
  router.push({ pathname: '/workout/[id]', params: { id: String(id) } });
}

/** Starts a workout (from a routine or empty), handling one that is already running. */
export async function startWorkoutFlow(db: SQLiteDatabase, routineId?: number) {
  const active = await getActiveWorkout(db);
  if (active) {
    const resume = await confirm({
      title: 'Workout in progress',
      message: `"${active.name}" is still running. Resume it instead?`,
      confirmText: 'Resume',
    });
    if (resume) return openWorkout(active.id);
    const discard = await confirm({
      title: 'Discard the current workout?',
      message: 'Sets logged in it will be lost.',
      confirmText: 'Discard',
      destructive: true,
    });
    if (!discard) return;
    await deleteWorkout(db, active.id);
  }
  openWorkout(await startWorkout(db, routineId));
}
