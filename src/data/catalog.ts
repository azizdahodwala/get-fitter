// The exercise library. Data and animated demos come from ExerciseDB
// (https://github.com/exercisedb/exercisedb-api); the JSON is downloaded once
// with `npm run fetch-exercises` and bundled so the app works offline.
import raw from './exercises.json';

export type Exercise = {
  id: string;
  name: string;
  gif: string;
  bodyParts: string[];
  equipment: string[];
  target: string[];
  secondary: string[];
  steps: string[];
};

/** How sets of an exercise are logged. */
export type TrackingMode = 'weight' | 'reps' | 'time';

export const EXERCISES: readonly Exercise[] = raw as Exercise[];

const byId = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id);
}

function countBy(pick: (e: Exercise) => string[]) {
  const counts = new Map<string, number>();
  for (const e of EXERCISES) for (const v of pick(e)) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

/** Every equipment value in the catalog, most common first. */
export const ALL_EQUIPMENT = countBy((e) => e.equipment);
export const ALL_BODY_PARTS = countBy((e) => e.bodyParts);

/** Typical condo-gym / home setup, used until the user picks their own. */
export const DEFAULT_EQUIPMENT = [
  'bodyweight',
  'dumbbell',
  'kettlebell',
  'resistance band',
  'stability ball',
  'medicine ball',
];

export function titleCase(s: string) {
  return s.replace(/(^|[\s(-])([a-z])/g, (_, p, c: string) => p + c.toUpperCase());
}

export function displayName(e: Exercise | undefined) {
  return e ? titleCase(e.name) : 'Unknown exercise';
}

const TIMED = /plank|hold|stretch|wall sit|isometric|dead hang|l-sit|hollow|jog|run\b|running|walk\b|walking(?! lunge)|cycling|bike|elliptical|jump rope|skipping|stepmill|ergometer/i;
const NO_WEIGHT = new Set([
  'bodyweight',
  'assisted',
  'resistance band',
  'stability ball',
  'roller',
  'suspension trainer',
  'bosu ball',
  'rope',
  'towel',
  'tennis ball',
]);

/**
 * Whether the exercise is loaded with weight you pick (dumbbell, kettlebell,
 * barbell, machine stack...), as opposed to bodyweight or band work.
 */
export function usesWeight(e: Exercise | undefined) {
  return !e || e.equipment.some((q) => !NO_WEIGHT.has(q));
}

/** Short equipment label for an exercise, e.g. "Dumbbell" or "Bodyweight". */
export function equipmentLabel(e: Exercise | undefined) {
  return e ? titleCase(e.equipment.join(' + ')) : '';
}

/** Best guess at how an exercise is logged; the user can switch it per workout. */
export function defaultMode(e: Exercise | undefined): TrackingMode {
  if (!e) return 'weight';
  if (TIMED.test(e.name)) return 'time';
  return usesWeight(e) ? 'weight' : 'reps';
}

/**
 * The ways an exercise can be logged, its usual one first. On bodyweight
 * exercises "weight" means load added on top (a vest, a belt, a dumbbell).
 */
export function modeOptions(e: Exercise | undefined): { value: TrackingMode; label: string }[] {
  return usesWeight(e)
    ? [
        { value: 'weight', label: 'Weight × reps' },
        { value: 'reps', label: 'Reps only' },
        { value: 'time', label: 'Timed' },
      ]
    : [
        { value: 'reps', label: 'Bodyweight' },
        { value: 'weight', label: '+ Weight' },
        { value: 'time', label: 'Timed' },
      ];
}

export function youtubeSearchUrl(e: Exercise) {
  const q = encodeURIComponent(`${e.name} exercise proper form`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

export type ExerciseFilter = {
  query?: string;
  bodyPart?: string | null;
  /** Only exercises doable with this equipment (all of the exercise's equipment must be in the list). */
  equipment?: string[] | null;
};

export function filterExercises({ query, bodyPart, equipment }: ExerciseFilter) {
  const tokens = (query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const have = equipment ? new Set(equipment) : null;
  return EXERCISES.filter((e) => {
    if (bodyPart && !e.bodyParts.includes(bodyPart)) return false;
    if (have && !e.equipment.every((q) => have.has(q))) return false;
    if (tokens.length) {
      const hay = `${e.name} ${e.target.join(' ')} ${e.equipment.join(' ')} ${e.bodyParts.join(' ')}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    }
    return true;
  });
}
