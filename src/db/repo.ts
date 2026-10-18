import type { SQLiteDatabase } from 'expo-sqlite';

import { defaultMode, getExercise, usesWeight, type TrackingMode } from '@/data/catalog';
import type { Level } from '@/data/programs';

// ---------- Types ----------

export type Routine = {
  id: number;
  name: string;
  notes: string | null;
  starter_key: string | null;
  level: Level | null;
  created_at: number;
  updated_at: number;
};

export type RoutineItem = {
  id: number;
  routine_id: number;
  exercise_id: string;
  position: number;
  sets: number;
  reps: number | null;
  seconds: number | null;
  /** Planned load per set, if the user set one. */
  weight_kg: number | null;
};

export type RoutineItemInput = Pick<RoutineItem, 'exercise_id' | 'sets' | 'reps' | 'seconds' | 'weight_kg'>;
export type RoutineSummary = Routine & { exerciseIds: string[] };

export type Workout = {
  id: number;
  routine_id: number | null;
  name: string;
  notes: string | null;
  started_at: number;
  finished_at: number | null;
};

export type WorkoutExercise = {
  id: number;
  workout_id: number;
  exercise_id: string;
  position: number;
  mode: TrackingMode;
  target_reps: number | null;
  target_seconds: number | null;
  target_weight_kg: number | null;
};

export type SetRow = {
  id: number;
  workout_exercise_id: number;
  position: number;
  weight_kg: number | null;
  reps: number | null;
  seconds: number | null;
  done: number;
};

export type SetValues = Pick<SetRow, 'weight_kg' | 'reps' | 'seconds'>;

export type WorkoutExerciseDetail = WorkoutExercise & {
  sets: SetRow[];
  /** Completed sets from the last time this exercise was done, for placeholders. */
  previous: SetValues[];
};

export type WorkoutDetail = Workout & { exercises: WorkoutExerciseDetail[] };

export type WorkoutSummary = Workout & {
  set_count: number;
  volume_kg: number;
  exercises: { exercise_id: string; sets: number }[];
};

export type BodyMetric = {
  id: number;
  measured_at: number;
  weight_kg: number | null;
  body_fat: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
};

export type BodyMetricInput = Omit<BodyMetric, 'id'> & { id?: number };

export type ExerciseSession = {
  workoutId: number;
  workoutName: string;
  startedAt: number;
  mode: TrackingMode;
  sets: SetValues[];
};

// ---------- Settings ----------

export async function loadSettings(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
}

export async function saveSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

// ---------- Routines ----------

export async function listRoutines(db: SQLiteDatabase): Promise<RoutineSummary[]> {
  const routines = await db.getAllAsync<Routine>('SELECT * FROM routines ORDER BY updated_at DESC, id DESC');
  const items = await db.getAllAsync<{ routine_id: number; exercise_id: string }>(
    'SELECT routine_id, exercise_id FROM routine_exercises ORDER BY routine_id, position',
  );
  const byRoutine = new Map<number, string[]>();
  for (const it of items) {
    const list = byRoutine.get(it.routine_id) ?? [];
    list.push(it.exercise_id);
    byRoutine.set(it.routine_id, list);
  }
  return routines.map((r) => ({ ...r, exerciseIds: byRoutine.get(r.id) ?? [] }));
}

export async function getRoutine(db: SQLiteDatabase, id: number) {
  const routine = await db.getFirstAsync<Routine>('SELECT * FROM routines WHERE id = ?', id);
  if (!routine) return null;
  const items = await db.getAllAsync<RoutineItem>(
    'SELECT * FROM routine_exercises WHERE routine_id = ? ORDER BY position',
    id,
  );
  return { routine, items };
}

export async function saveRoutine(
  db: SQLiteDatabase,
  input: { id?: number; name: string; notes: string | null; items: RoutineItemInput[] },
) {
  const now = Date.now();
  let id = input.id;
  await db.withTransactionAsync(async () => {
    if (id) {
      await db.runAsync(
        'UPDATE routines SET name = ?, notes = ?, updated_at = ? WHERE id = ?',
        input.name,
        input.notes,
        now,
        id,
      );
      await db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', id);
    } else {
      const res = await db.runAsync(
        'INSERT INTO routines (name, notes, created_at, updated_at) VALUES (?, ?, ?, ?)',
        input.name,
        input.notes,
        now,
        now,
      );
      id = res.lastInsertRowId;
    }
    let position = 0;
    for (const it of input.items) {
      await db.runAsync(
        'INSERT INTO routine_exercises (routine_id, exercise_id, position, sets, reps, seconds, weight_kg) VALUES (?, ?, ?, ?, ?, ?, ?)',
        id!,
        it.exercise_id,
        position++,
        it.sets,
        it.reps,
        it.seconds,
        it.weight_kg,
      );
    }
  });
  return id!;
}

export async function deleteRoutine(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM routines WHERE id = ?', id);
}

export async function duplicateRoutine(db: SQLiteDatabase, id: number) {
  const found = await getRoutine(db, id);
  if (!found) return null;
  return saveRoutine(db, {
    name: `${found.routine.name} (copy)`,
    notes: found.routine.notes,
    items: found.items,
  });
}

// ---------- Tracking mode preferences ----------

export async function modeFor(db: SQLiteDatabase, exerciseId: string): Promise<TrackingMode> {
  const pref = await db.getFirstAsync<{ mode: TrackingMode }>(
    'SELECT mode FROM exercise_prefs WHERE exercise_id = ?',
    exerciseId,
  );
  return pref?.mode ?? defaultMode(getExercise(exerciseId));
}

/** Every exercise the user has picked a tracking mode for. */
export async function modePrefs(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ exercise_id: string; mode: TrackingMode }>('SELECT * FROM exercise_prefs');
  return new Map(rows.map((r) => [r.exercise_id, r.mode]));
}

/**
 * How a routine item is logged: timed if it has a target time, by weight if it
 * has a target weight, otherwise how the user usually logs the exercise.
 */
export function itemMode(
  it: Pick<RoutineItem, 'exercise_id' | 'seconds' | 'weight_kg'>,
  prefs: Map<string, TrackingMode>,
): TrackingMode {
  if (it.seconds) return 'time';
  if (it.weight_kg != null) return 'weight';
  const ex = getExercise(it.exercise_id);
  const mode = prefs.get(it.exercise_id) ?? defaultMode(ex);
  // An item with reps is never timed, even if the exercise usually is.
  if (mode === 'time') return usesWeight(ex) ? 'weight' : 'reps';
  return mode;
}

export async function setExerciseMode(db: SQLiteDatabase, exerciseId: string, mode: TrackingMode) {
  await db.runAsync(
    'INSERT INTO exercise_prefs (exercise_id, mode) VALUES (?, ?) ON CONFLICT(exercise_id) DO UPDATE SET mode = excluded.mode',
    exerciseId,
    mode,
  );
}

export async function setWorkoutExerciseMode(
  db: SQLiteDatabase,
  workoutExerciseId: number,
  exerciseId: string,
  mode: TrackingMode,
) {
  await db.runAsync('UPDATE workout_exercises SET mode = ? WHERE id = ?', mode, workoutExerciseId);
  await setExerciseMode(db, exerciseId, mode);
}

// ---------- Workouts ----------

function defaultWorkoutName(at: number) {
  const h = new Date(at).getHours();
  if (h < 5) return 'Late Night Workout';
  if (h < 12) return 'Morning Workout';
  if (h < 17) return 'Afternoon Workout';
  return 'Evening Workout';
}

export async function getActiveWorkout(db: SQLiteDatabase) {
  return db.getFirstAsync<Workout>(
    'SELECT * FROM workouts WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1',
  );
}

async function previousSets(db: SQLiteDatabase, exerciseId: string, before: number, excludeWorkoutId: number) {
  return db.getAllAsync<SetValues>(
    `SELECT s.weight_kg, s.reps, s.seconds FROM sets s
     WHERE s.done = 1 AND s.workout_exercise_id = (
       SELECT we.id FROM workout_exercises we JOIN workouts w ON w.id = we.workout_id
       WHERE we.exercise_id = ? AND w.finished_at IS NOT NULL AND w.started_at < ? AND w.id != ?
       ORDER BY w.started_at DESC, we.position DESC LIMIT 1)
     ORDER BY s.position`,
    exerciseId,
    before,
    excludeWorkoutId,
  );
}

async function insertWorkoutExercise(
  db: SQLiteDatabase,
  workoutId: number,
  position: number,
  exerciseId: string,
  mode: TrackingMode,
  setCount: number,
  target: { reps: number | null; seconds: number | null; weight_kg: number | null },
) {
  const { lastInsertRowId } = await db.runAsync(
    'INSERT INTO workout_exercises (workout_id, exercise_id, position, mode, target_reps, target_seconds, target_weight_kg) VALUES (?, ?, ?, ?, ?, ?, ?)',
    workoutId,
    exerciseId,
    position,
    mode,
    target.reps,
    target.seconds,
    target.weight_kg,
  );
  for (let i = 0; i < setCount; i++) {
    await db.runAsync('INSERT INTO sets (workout_exercise_id, position) VALUES (?, ?)', lastInsertRowId, i);
  }
}

/** Starts a workout, optionally pre-filled from a routine. Returns the workout id. */
export async function startWorkout(db: SQLiteDatabase, routineId?: number) {
  const now = Date.now();
  const routine = routineId ? await getRoutine(db, routineId) : null;
  const prefs = await modePrefs(db);
  let workoutId = 0;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      'INSERT INTO workouts (routine_id, name, started_at) VALUES (?, ?, ?)',
      routine?.routine.id ?? null,
      routine?.routine.name ?? defaultWorkoutName(now),
      now,
    );
    workoutId = res.lastInsertRowId;
    let position = 0;
    for (const it of routine?.items ?? []) {
      await insertWorkoutExercise(db, workoutId, position++, it.exercise_id, itemMode(it, prefs), Math.max(1, it.sets), {
        reps: it.reps,
        seconds: it.seconds,
        weight_kg: it.weight_kg,
      });
    }
  });
  return workoutId;
}

export async function getWorkout(db: SQLiteDatabase, id: number): Promise<WorkoutDetail | null> {
  const workout = await db.getFirstAsync<Workout>('SELECT * FROM workouts WHERE id = ?', id);
  if (!workout) return null;
  const exercises = await db.getAllAsync<WorkoutExercise>(
    'SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY position',
    id,
  );
  const sets = await db.getAllAsync<SetRow>(
    `SELECT s.* FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
     WHERE we.workout_id = ? ORDER BY s.position`,
    id,
  );
  const detail: WorkoutExerciseDetail[] = [];
  for (const we of exercises) {
    detail.push({
      ...we,
      sets: sets.filter((s) => s.workout_exercise_id === we.id),
      previous: await previousSets(db, we.exercise_id, workout.started_at, id),
    });
  }
  return { ...workout, exercises: detail };
}

export async function addExercisesToWorkout(db: SQLiteDatabase, workoutId: number, exerciseIds: string[]) {
  const workout = await db.getFirstAsync<Workout>('SELECT * FROM workouts WHERE id = ?', workoutId);
  if (!workout) return;
  const max = await db.getFirstAsync<{ p: number | null }>(
    'SELECT MAX(position) AS p FROM workout_exercises WHERE workout_id = ?',
    workoutId,
  );
  let position = (max?.p ?? -1) + 1;
  await db.withTransactionAsync(async () => {
    for (const exerciseId of exerciseIds) {
      const prev = await previousSets(db, exerciseId, workout.started_at, workoutId);
      await insertWorkoutExercise(db, workoutId, position++, exerciseId, await modeFor(db, exerciseId), prev.length || 3, {
        reps: null,
        seconds: null,
        weight_kg: null,
      });
    }
  });
}

export async function removeWorkoutExercise(db: SQLiteDatabase, workoutExerciseId: number) {
  await db.runAsync('DELETE FROM workout_exercises WHERE id = ?', workoutExerciseId);
}

export async function addSet(db: SQLiteDatabase, workoutExerciseId: number) {
  const max = await db.getFirstAsync<{ p: number | null }>(
    'SELECT MAX(position) AS p FROM sets WHERE workout_exercise_id = ?',
    workoutExerciseId,
  );
  const { lastInsertRowId } = await db.runAsync(
    'INSERT INTO sets (workout_exercise_id, position) VALUES (?, ?)',
    workoutExerciseId,
    (max?.p ?? -1) + 1,
  );
  return (await db.getFirstAsync<SetRow>('SELECT * FROM sets WHERE id = ?', lastInsertRowId))!;
}

export async function updateSet(
  db: SQLiteDatabase,
  setId: number,
  values: Partial<Pick<SetRow, 'weight_kg' | 'reps' | 'seconds' | 'done'>>,
) {
  const keys = (['weight_kg', 'reps', 'seconds', 'done'] as const).filter((k) => k in values);
  if (!keys.length) return;
  await db.runAsync(
    `UPDATE sets SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
    ...keys.map((k) => values[k] ?? null),
    setId,
  );
}

export async function deleteSet(db: SQLiteDatabase, setId: number) {
  await db.runAsync('DELETE FROM sets WHERE id = ?', setId);
}

export async function renameWorkout(db: SQLiteDatabase, id: number, name: string) {
  await db.runAsync('UPDATE workouts SET name = ? WHERE id = ?', name, id);
}

export async function countDoneSets(db: SQLiteDatabase, workoutId: number) {
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
     WHERE we.workout_id = ? AND s.done = 1`,
    workoutId,
  );
  return row?.n ?? 0;
}

/** Marks a workout finished, dropping unchecked sets and exercises left empty. */
export async function finishWorkout(db: SQLiteDatabase, id: number) {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'DELETE FROM sets WHERE done = 0 AND workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id = ?)',
      id,
    );
    await db.runAsync(
      'DELETE FROM workout_exercises WHERE workout_id = ? AND id NOT IN (SELECT workout_exercise_id FROM sets)',
      id,
    );
    await db.runAsync('UPDATE workouts SET finished_at = ? WHERE id = ?', Date.now(), id);
  });
}

export async function deleteWorkout(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
}

// ---------- History ----------

export async function listWorkoutHistory(db: SQLiteDatabase): Promise<WorkoutSummary[]> {
  const workouts = await db.getAllAsync<Workout & { set_count: number; volume_kg: number }>(
    `SELECT w.*,
       (SELECT COUNT(*) FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
        WHERE we.workout_id = w.id AND s.done = 1) AS set_count,
       (SELECT COALESCE(SUM(s.weight_kg * s.reps), 0) FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
        WHERE we.workout_id = w.id AND s.done = 1 AND we.mode = 'weight') AS volume_kg
     FROM workouts w WHERE w.finished_at IS NOT NULL ORDER BY w.started_at DESC`,
  );
  const rows = await db.getAllAsync<{ workout_id: number; exercise_id: string; sets: number }>(
    `SELECT we.workout_id, we.exercise_id, COUNT(s.id) AS sets
     FROM workout_exercises we
     JOIN workouts w ON w.id = we.workout_id
     LEFT JOIN sets s ON s.workout_exercise_id = we.id AND s.done = 1
     WHERE w.finished_at IS NOT NULL
     GROUP BY we.id ORDER BY we.workout_id, we.position`,
  );
  const byWorkout = new Map<number, { exercise_id: string; sets: number }[]>();
  for (const r of rows) {
    const list = byWorkout.get(r.workout_id) ?? [];
    list.push({ exercise_id: r.exercise_id, sets: r.sets });
    byWorkout.set(r.workout_id, list);
  }
  return workouts.map((w) => ({ ...w, exercises: byWorkout.get(w.id) ?? [] }));
}

export async function getExerciseHistory(db: SQLiteDatabase, exerciseId: string): Promise<ExerciseSession[]> {
  const rows = await db.getAllAsync<
    SetValues & { workout_id: number; name: string; started_at: number; we_id: number; mode: TrackingMode }
  >(
    `SELECT w.id AS workout_id, w.name, w.started_at, we.id AS we_id, we.mode, s.weight_kg, s.reps, s.seconds
     FROM workout_exercises we
     JOIN workouts w ON w.id = we.workout_id
     JOIN sets s ON s.workout_exercise_id = we.id
     WHERE we.exercise_id = ? AND w.finished_at IS NOT NULL AND s.done = 1
     ORDER BY w.started_at DESC, we.position, s.position`,
    exerciseId,
  );
  const sessions: ExerciseSession[] = [];
  let lastWe = -1;
  for (const r of rows) {
    if (r.we_id !== lastWe) {
      sessions.push({ workoutId: r.workout_id, workoutName: r.name, startedAt: r.started_at, mode: r.mode, sets: [] });
      lastWe = r.we_id;
    }
    sessions[sessions.length - 1].sets.push({ weight_kg: r.weight_kg, reps: r.reps, seconds: r.seconds });
  }
  return sessions;
}

// ---------- Plan progress ----------

/** The routine of the most recent finished workout among `routineIds`, if any. */
export async function lastRoutineDone(db: SQLiteDatabase, routineIds: number[]) {
  if (!routineIds.length) return null;
  const row = await db.getFirstAsync<{ routine_id: number }>(
    `SELECT routine_id FROM workouts
     WHERE finished_at IS NOT NULL AND routine_id IN (${routineIds.map(() => '?').join(', ')})
     ORDER BY started_at DESC LIMIT 1`,
    ...routineIds,
  );
  return row?.routine_id ?? null;
}

export async function countWorkoutsSince(db: SQLiteDatabase, since: number) {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM workouts WHERE finished_at IS NOT NULL AND started_at >= ?',
    since,
  );
  return row?.n ?? 0;
}

// ---------- Body metrics ----------

const METRIC_COLUMNS = ['measured_at', 'weight_kg', 'body_fat', 'waist_cm', 'chest_cm', 'hips_cm', 'arm_cm'] as const;

/** Newest first. */
export async function listBodyMetrics(db: SQLiteDatabase) {
  return db.getAllAsync<BodyMetric>('SELECT * FROM body_metrics ORDER BY measured_at DESC, id DESC');
}

export async function getBodyMetric(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<BodyMetric>('SELECT * FROM body_metrics WHERE id = ?', id);
}

export async function saveBodyMetric(db: SQLiteDatabase, input: BodyMetricInput) {
  const values = METRIC_COLUMNS.map((c) => input[c] ?? null);
  if (input.id) {
    await db.runAsync(
      `UPDATE body_metrics SET ${METRIC_COLUMNS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      ...values,
      input.id,
    );
    return input.id;
  }
  const res = await db.runAsync(
    `INSERT INTO body_metrics (${METRIC_COLUMNS.join(', ')}) VALUES (${METRIC_COLUMNS.map(() => '?').join(', ')})`,
    ...values,
  );
  return res.lastInsertRowId;
}

export async function deleteBodyMetric(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM body_metrics WHERE id = ?', id);
}

// ---------- Backup ----------

// Columns allowed per table, in insert order. Import only touches these names,
// so a hand-edited backup can't inject SQL through its keys.
const TABLES = {
  settings: ['key', 'value'],
  routines: ['id', 'name', 'notes', 'starter_key', 'level', 'created_at', 'updated_at'],
  routine_exercises: ['id', 'routine_id', 'exercise_id', 'position', 'sets', 'reps', 'seconds', 'weight_kg'],
  workouts: ['id', 'routine_id', 'name', 'notes', 'started_at', 'finished_at'],
  workout_exercises: ['id', 'workout_id', 'exercise_id', 'position', 'mode', 'target_reps', 'target_seconds', 'target_weight_kg'],
  sets: ['id', 'workout_exercise_id', 'position', 'weight_kg', 'reps', 'seconds', 'done'],
  exercise_prefs: ['exercise_id', 'mode'],
  body_metrics: ['id', 'measured_at', 'weight_kg', 'body_fat', 'waist_cm', 'chest_cm', 'hips_cm', 'arm_cm'],
} as const;

type TableName = keyof typeof TABLES;
type Row = Record<string, string | number | null>;

export type Backup = {
  app: 'get-fitter';
  version: 1;
  exportedAt: string;
  tables: Record<TableName, Row[]>;
};

export async function exportBackup(db: SQLiteDatabase): Promise<Backup> {
  const tables = {} as Record<TableName, Row[]>;
  for (const [name, cols] of Object.entries(TABLES) as [TableName, readonly string[]][]) {
    tables[name] = await db.getAllAsync<Row>(`SELECT ${cols.join(', ')} FROM ${name}`);
  }
  return { app: 'get-fitter', version: 1, exportedAt: new Date().toISOString(), tables };
}

export function parseBackup(text: string): Backup {
  const data = JSON.parse(text);
  if (data?.app !== 'get-fitter' || data?.version !== 1 || typeof data.tables !== 'object') {
    throw new Error('This file is not a Get Fitter backup.');
  }
  for (const name of Object.keys(TABLES)) {
    if (!Array.isArray(data.tables[name])) throw new Error(`Backup is missing the "${name}" table.`);
  }
  return data as Backup;
}

/** Replaces everything in the database with the backup's contents. */
export async function importBackup(db: SQLiteDatabase, backup: Backup) {
  const names = Object.keys(TABLES) as TableName[];
  await db.withTransactionAsync(async () => {
    for (const name of [...names].reverse()) await db.runAsync(`DELETE FROM ${name}`);
    for (const name of names) {
      const cols = TABLES[name];
      const sql = `INSERT INTO ${name} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
      for (const row of backup.tables[name]) {
        await db.runAsync(sql, ...cols.map((c) => row[c] ?? null));
      }
    }
  });
}
