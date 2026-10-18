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
  // Exercises whose demo GIF is gone (the 2026-10-18 sweep, src/data/missing-gifs.json)
  // are no longer offered for picking. Move rows that still use one to its
  // same-name twin, so the thumbnail loads and history stays under one id. A pref
  // already stored under the twin wins, as in migration 2.
  `
  CREATE TEMP TABLE exercise_remap (old_id TEXT PRIMARY KEY NOT NULL, new_id TEXT NOT NULL);
  INSERT INTO exercise_remap (old_id, new_id) VALUES
    ('LzX8YEz', 'qBcKorM'), ('fBnPpzd', 'VedGSby'), ('5ipN0iE', 'kiJ4Z2K'), ('Aj9vWh7', 'RoV1Rfa'),
    ('LlSe9IK', '7OeHptV'), ('7R4NIjL', '7HcfMBP'), ('3pqGMQj', 'ztAa1RK'), ('UI81amT', 'ztAa1RK'),
    ('8IbNZwc', 'E4R8Hz1'), ('58rdhvL', 'KCBKjma'), ('JxrY9mC', 'pmnrOp0'), ('Ul5OFSV', 'Y1MsI1l'),
    ('PKlXuJW', 'zFzbBfL'), ('Qj0HRAZ', '0xDpB4L'), ('hTLtkXL', 'S93zLTG'), ('L68dTQj', 'S1JXDAG'),
    ('omsF3RN', 'obe5LMq'), ('pgIdT6i', 'km0sQC0'), ('PDHE73u', 'lHeUULr'), ('lRcrlH8', 'KUaoUV8'),
    ('0I5fUyn', 'k6tUeqS'), ('kLiIFdB', 'G7PXMlT'), ('EnPivTL', 'cA9FuWG'), ('KenZJQV', 'Gnfo4FM'),
    ('9Z23cLE', '3TZduzM'), ('OJFgZJ0', 'yg8Totb'), ('1TVoin7', 'iZop9xO'), ('Um8xUAc', 'WLvTAv5'),
    ('EqHIIjJ', '4LIG9xr'), ('YA2HKGz', 'LsZkfU6'), ('o6LqKKP', 'wQ2c4XD'), ('ntjtCfu', 'BCs0G2F'),
    ('qFHvMnv', 'euI1BwR'), ('echClj7', 'oR7O9LW'), ('AdxxqfF', 'LWuA3aZ'), ('oMwyl17', 'hrVQWvE'),
    ('1oE78pm', '83HoW9X'), ('3QgteDK', '945zpRg'), ('hVzPY5j', 'RJa4tCo'), ('gTGciXz', '0Yz8WdV'),
    ('8yBgwBS', 'NvfE43H'), ('jCBOdh0', '7saC5zz'), ('N6dZN2I', 'ZSJNetl'), ('dAJscVq', 'yaMIo4D'),
    ('drfGhTV', 'tBWXbIT'), ('IxsFgRT', 'MvQPqVW'), ('CUmLRTA', 'WW95auq'), ('eZ79rbI', 'G61cXLk'),
    ('nFHk9fU', 'CuaWCmC'), ('WM6TvvW', 'hvV79Si'), ('9fCHfSc', 'OmQ8w0p'), ('0MlxeMn', 'qdRxqCj'),
    ('w7obpWd', '3ZflifB'), ('vNPJbDA', 'ZujAdR9'), ('A3P4O0R', 'fUBheHs'), ('UOphC6N', 'wPypxFY'),
    ('QoSZo2Y', 'GKEH6jj'), ('myJeTAe', 'wEulIzp'), ('Y8dOJlH', 'f7fnAIB'), ('vN5HB0s', 'jpgqxiS'),
    ('8gQo5Ss', 'XU3ePuv'), ('qU8bYp7', 'sYCcnon'), ('9tvVVM9', 'gAwDzB3'), ('3nvEbbF', 'zCgxPbV'),
    ('vobtVkm', 'PzNxakt'), ('fF6GKVh', 'xGgAGPm'), ('iDGtjyi', 'Uto7l43'), ('W1p7BND', 'ykA5tU7'),
    ('dVeWXf2', 'T2mxWqc'), ('IU4QNJ6', 'T2mxWqc'), ('xOXZJRZ', 'CMAxnsG'), ('VsopqcV', 'x6KpKpq'),
    ('7i4msxz', 'SLKj2pX'), ('xmWQIlT', 'J74XlNf'), ('Xd65M9w', 'vi8EhoE'), ('IH2kr7n', 'bRlbdjK'),
    ('79AmJsI', '2NpxjC1'), ('qlZUaZ8', 'Bg5JKSH'), ('sJElUUI', 'Bg5JKSH'), ('1RIkUHT', 'cALkHHX'),
    ('Uywa4S5', 'RRWFUcw'), ('7AnZtSv', 'KI1DjNN'), ('QQwxa8g', 'hwygydB'), ('syUwUKY', 'bpJL2Qs'),
    ('ookVu2D', 'lI7easp'), ('KQfySvS', 'Nh3mvOO'), ('UoX77uR', 'FxhcxUW'), ('r4RZKpF', 'Am02iPd'),
    ('W7yh3Yo', 'ziFKQXP'), ('XqYQ9JA', 'LIGZSTA'), ('vocve3e', 'pH2x2jj'), ('gWcZD4q', 'bBi35y3'),
    ('XE93sQZ', '76vfTdU'), ('7858za8', 'gFyFj9z'), ('2Ty4idJ', '5eLRITT'), ('LFIOery', 'BmrwWzo'),
    ('u1iHcoD', 'x306lCW'), ('b5uBMv2', 'EyLrNC2'), ('hjWjJEm', '2LQkNPW'), ('pNIKolI', '7ePTw4B'),
    ('kKYTkjJ', 'M72BExt'), ('M8IolhQ', 'hacCyUv'), ('TBNaSNs', 'DgZQ11d'), ('I6Ca0a7', '6CKUx7o'),
    ('iqH55N8', 'kMzUs9Y'), ('Ql4g5s8', 'kMzUs9Y'), ('mAYqY4M', 'gw9PqGk'), ('v6EKk0O', 'ia6kIIl'),
    ('lFBTISi', 'BaE7O6U'), ('gdPIyyO', 'nuBF9MO'), ('Sa8mzWc', 'nuBF9MO'), ('WFucoe6', 'Q6bvyen'),
    ('6vcvsLS', '4Ml7QFO'), ('EpKrFiv', 'CB8WET1'), ('woLo1QN', 'F7vjXqT'), ('fjjY3N4', '0rHfvy9'),
    ('1YUWDNZ', 'bZGHsAZ'), ('p5v6rdT', 'pZwUsKB'), ('Mr8d4KA', 'UM8mgyG'), ('j6uIfep', 'rseLfH3'),
    ('o80Xu9C', 'rseLfH3'), ('89HVjEp', 'BkxB8LW'), ('u3UuCZu', 'wf24o8S'), ('znf7t8E', 'pM07UxU'),
    ('tuIZFDt', 'h1ezqSu'), ('xcLntTC', 'OyoZ3Pu'), ('mpYUPkA', '9IxJdtC'), ('N3EirIW', 'MaMuGH6'),
    ('KWyEjtI', 'LuBEORI'), ('V7rWsT5', 'CggQhII'), ('1u36hhy', 'IGjKj1v'), ('iCPqbki', 'IGjKj1v'),
    ('7y9JIMj', 'kj3hy6W'), ('numr601', 'WbNq5Xu'), ('iFsqlCD', '8K7m2SS'), ('vpleANJ', 'D9qe7CM'),
    ('4QqYaJW', '1IG6gVF'), ('P7zSvul', 'wVompEp'), ('qBl14UC', 'LEH9jxP'), ('1IFV9h3', '4Jt8QsQ'),
    ('kk39rUy', 'KhHJ338'), ('MDFxU4b', '6YUfHPL'), ('IBj3nsn', 'mweqJin'), ('AwAIlSo', 'ecpY0rH'),
    ('gMyx3Qn', 'jV65tKx'), ('BeReYBf', 'isAAZWA'), ('ninBEOY', 'isAAZWA'), ('DICPHtq', 'fKZgDEO'),
    ('Rsxr3xl', 'ZZTGMKh'), ('jvEXp4N', 'FAoIFMw'), ('cuC7529', 'C31LMnP'), ('DoEYq4s', 'xdYPUtE'),
    ('gSO0KpB', '6ZCiYWQ'), ('4H86mXM', 'WWD6FzI'), ('p0OCXGb', 'tj41Nu6'), ('Dx2RIva', 'u0pLNgz'),
    ('5lE7XRz', 'ZX9UZmj'), ('C8Crfa4', 'WcHl7ru'), ('afv0ZAS', '5v7KYld'), ('7WcQgkm', 'o8aOcrz'),
    ('Gu2ENkm', 'QyO6Uma'), ('MRaFiZP', 'xUwnBMT'), ('VRBGPHB', '903mzG8'), ('w44vFvP', 'Q4DSJPC'),
    ('O3INw8V', 'DIVyqrU'), ('HZgQPxh', 'X3TCNEU'), ('9ZGnq1w', 'Wgbn9qo'), ('6Wr0F3W', 'C0eCeEt'),
    ('PCUYOMs', 'rjtuP6X'), ('pFuK3by', 'rjtuP6X'), ('9vz4JlC', '5WiFcYk'), ('G1qWW6M', 'fXfqg1E'),
    ('J1vH2X0', 'fXfqg1E'), ('F56Xpw3', 'Ff18ItA'), ('FSF9WOs', 'O2K9Vb5'), ('MqNdIbe', 'bd5b860');
  UPDATE routine_exercises
    SET exercise_id = (SELECT new_id FROM exercise_remap WHERE old_id = routine_exercises.exercise_id)
    WHERE exercise_id IN (SELECT old_id FROM exercise_remap);
  UPDATE workout_exercises
    SET exercise_id = (SELECT new_id FROM exercise_remap WHERE old_id = workout_exercises.exercise_id)
    WHERE exercise_id IN (SELECT old_id FROM exercise_remap);
  UPDATE OR IGNORE exercise_prefs
    SET exercise_id = (SELECT new_id FROM exercise_remap WHERE old_id = exercise_prefs.exercise_id)
    WHERE exercise_id IN (SELECT old_id FROM exercise_remap);
  DELETE FROM exercise_prefs WHERE exercise_id IN (SELECT old_id FROM exercise_remap);
  DROP TABLE exercise_remap;
  `,
];

/** Migration 3 on its own. Backups made before it can still hold those ids, so importBackup reruns it. */
export const REMAP_MISSING_GIFS = MIGRATIONS[3];

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
