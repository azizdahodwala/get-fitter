import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import { defaultMode, getExercise } from '@/data/catalog';
import { STARTER_ROUTINES, type StarterRoutine } from '@/data/programs';

export const DATABASE_NAME = 'get-fitter.db';

// Each entry upgrades the schema by one version (tracked in PRAGMA user_version).
// Never edit a shipped migration; append a new one instead.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  CREATE TABLE routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    notes TEXT,
    starter_key TEXT,
    level TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE routine_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    sets INTEGER NOT NULL DEFAULT 3,
    reps INTEGER,
    seconds INTEGER
  );
  CREATE TABLE workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER REFERENCES routines(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    notes TEXT,
    started_at INTEGER NOT NULL,
    finished_at INTEGER
  );
  CREATE TABLE workout_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    mode TEXT NOT NULL,
    target_reps INTEGER,
    target_seconds INTEGER
  );
  CREATE TABLE sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    weight_kg REAL,
    reps INTEGER,
    seconds INTEGER,
    done INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE exercise_prefs (
    exercise_id TEXT PRIMARY KEY NOT NULL,
    mode TEXT NOT NULL
  );
  CREATE TABLE body_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    measured_at INTEGER NOT NULL,
    weight_kg REAL,
    body_fat REAL,
    waist_cm REAL,
    chest_cm REAL,
    hips_cm REAL,
    arm_cm REAL
  );
  CREATE INDEX idx_body_metrics_measured ON body_metrics(measured_at);
  CREATE INDEX idx_routine_exercises_routine ON routine_exercises(routine_id, position);
  CREATE INDEX idx_workouts_started ON workouts(started_at);
  CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id, position);
  CREATE INDEX idx_workout_exercises_exercise ON workout_exercises(exercise_id);
  CREATE INDEX idx_sets_workout_exercise ON sets(workout_exercise_id, position);
  `,
  // Target weights on routines, carried into workouts started from them; the
  // intermediate plan's original routines become its "A" days.
  `
  ALTER TABLE routine_exercises ADD COLUMN weight_kg REAL;
  ALTER TABLE workout_exercises ADD COLUMN target_weight_kg REAL;
  UPDATE routines SET name = 'Intermediate Upper A' WHERE starter_key = 'int-upper' AND name = 'Intermediate Upper';
  UPDATE routines SET name = 'Intermediate Lower A' WHERE starter_key = 'int-lower' AND name = 'Intermediate Lower';
  `,
  // Three starter exercises pointed at ExerciseDB ids whose demo GIFs are gone.
  // Move existing rows to the working duplicate of each, so history stays under
  // one id. A pref already stored under the new id wins over the old one.
  `
  UPDATE routine_exercises SET exercise_id = 'bZGHsAZ' WHERE exercise_id = '1YUWDNZ';
  UPDATE routine_exercises SET exercise_id = 'wf24o8S' WHERE exercise_id = 'u3UuCZu';
  UPDATE routine_exercises SET exercise_id = 'S93zLTG' WHERE exercise_id = 'hTLtkXL';
  UPDATE workout_exercises SET exercise_id = 'bZGHsAZ' WHERE exercise_id = '1YUWDNZ';
  UPDATE workout_exercises SET exercise_id = 'wf24o8S' WHERE exercise_id = 'u3UuCZu';
  UPDATE workout_exercises SET exercise_id = 'S93zLTG' WHERE exercise_id = 'hTLtkXL';
  UPDATE OR IGNORE exercise_prefs SET exercise_id = 'bZGHsAZ' WHERE exercise_id = '1YUWDNZ';
  UPDATE OR IGNORE exercise_prefs SET exercise_id = 'wf24o8S' WHERE exercise_id = 'u3UuCZu';
  UPDATE OR IGNORE exercise_prefs SET exercise_id = 'S93zLTG' WHERE exercise_id = 'hTLtkXL';
  DELETE FROM exercise_prefs WHERE exercise_id IN ('1YUWDNZ', 'u3UuCZu', 'hTLtkXL');
  `,
];

export async function migrateDb(db: SQLiteDatabase) {
  if (Platform.OS !== 'web') await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const v = version;
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]);
      await seedStarterRoutines(db, STARTER_ROUTINES.filter((r) => (r.since ?? 0) === v));
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
    version++;
  }
}

async function seedStarterRoutines(db: SQLiteDatabase, routines: StarterRoutine[]) {
  const now = Date.now();
  for (const r of routines) {
    const { lastInsertRowId } = await db.runAsync(
      'INSERT INTO routines (name, notes, starter_key, level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      r.name,
      r.notes,
      r.key,
      r.level,
      now,
      now,
    );
    let position = 0;
    for (const item of r.items) {
      if (!getExercise(item.id)) continue;
      await db.runAsync(
        'INSERT INTO routine_exercises (routine_id, exercise_id, position, sets, reps, seconds) VALUES (?, ?, ?, ?, ?, ?)',
        lastInsertRowId,
        item.id,
        position++,
        item.sets,
        item.reps ?? null,
        item.seconds ?? null,
      );
    }
    // Remember timed exercises so their first workout logs seconds, not reps.
    for (const item of r.items) {
      if (item.seconds && defaultMode(getExercise(item.id)) !== 'time') {
        await db.runAsync(
          'INSERT OR IGNORE INTO exercise_prefs (exercise_id, mode) VALUES (?, ?)',
          item.id,
          'time',
        );
      }
    }
  }
}
