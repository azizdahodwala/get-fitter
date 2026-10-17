// Training plans per experience level, plus a few standalone routines. Their
// routines are seeded into the database on first launch (see db/schema.ts) and
// are ordinary, editable routines after that. Exercise ids are ExerciseDB ids.
//
// Programs assume a condo gym: dumbbells, a bench and a pull-up bar.

export type Level = 'beginner' | 'intermediate' | 'advanced' | 'seasoned';

export const LEVELS: { value: Level; label: string; blurb: string }[] = [
  { value: 'beginner', label: 'Beginner', blurb: 'New to training, or back after a long break.' },
  { value: 'intermediate', label: 'Intermediate', blurb: 'Training consistently for 6+ months and comfortable with the basics.' },
  { value: 'advanced', label: 'Advanced', blurb: '2+ years of regular training; you know your working weights.' },
  { value: 'seasoned', label: 'Seasoned', blurb: 'Many years in; high volume and 5–6 days a week feel normal.' },
];

export function levelLabel(level: Level | null | undefined) {
  return LEVELS.find((l) => l.value === level)?.label ?? 'Not set';
}

export type StarterItem = { id: string; sets: number; reps?: number; seconds?: number };
export type StarterRoutine = { key: string; name: string; notes: string; level: Level; items: StarterItem[] };

export type Program = {
  level: Level;
  name: string;
  summary: string;
  daysPerWeek: number;
  /** Rest timer default for this level, in seconds. */
  restSeconds: number;
  /** Suggested week, Monday first: a routine key, or null for rest. */
  week: (string | null)[];
  /** Order to cycle through, so a missed day just shifts the plan. */
  rotation: string[];
  guidance: string[];
  routines: Omit<StarterRoutine, 'level'>[];
};

const ex = {
  gobletSquat: 'yn8yg1r',
  dbBench: 'SpYC0Kp',
  dbIncline: 'ns0SIbU',
  dbRow: 'BJ0Hz5L',
  dbShoulderPress: 'znQUdHY',
  dbRdl: 'rR0LJzx',
  dbDeadlift: 'nUwVh7b',
  dbCurl: 'NbVPDMW',
  dbHammer: '2NpxjC1',
  dbTricepsSeated: 'kont8Ut',
  dbTricepsLying: 'mpKZGWz',
  dbKickback: 'W6PxUkg',
  dbLateral: 'DsgkuIt',
  dbReverseFly: 'EAs3xL9',
  dbFly: 'yz9nUhF',
  dbShrug: 'NJzBsGJ',
  dbSplitSquat: 'qx4fgX7',
  dbStepUp: 'aXtJhlg',
  dbLunge: 'RRWFUcw',
  dbCalf: 'dPmaUaU',
  pushUp: 'I4hDWkc',
  kneelingPushUp: 'ZOuKWir',
  archerPushUp: 'A9qxk2F',
  clapPushUp: 'wigSg76',
  pullUp: 'lBDjFxJ',
  archerPullUp: '72BC5Za',
  invertedRow: '1YUWDNZ',
  dip: 'X6C6i5Y',
  weightedDip: 'bZq4bwK',
  pistolSquat: 'nqs5HGV',
  bodyweightSquat: '6YUfHPL',
  jumpSquat: 'LIlE5Tn',
  walkingLunge: 'IZVHb27',
  gluteBridge: 'u0cNiij',
  benchGluteBridge: 'aWedzZX',
  plank: 'hCjGsRQ',
  deadBug: 'iny3m5y',
  hangingLegRaise: 'I3tsCnC',
  russianTwist: 'XVDdcoj',
  mountainClimber: 'RJgzwny',
  burpee: 'dK9394r',
  kbSwing: 'UHJlbu3',
  kbGobletSquat: 'ZA8b5hc',
  kbRow: 'u3UuCZu',
  kbPress: 'blBXysN',
  bandSquat: 'TUZLh71',
  bandChestPress: '4x5Okof',
  bandRow: 'Nu7jqFE',
  bandShoulderPress: 'hTLtkXL',
  bandRdl: 'KUaoUV8',
  bandCurl: '3omWx6P',
};

export const PROGRAMS: Program[] = [
  {
    level: 'beginner',
    name: 'Foundations',
    summary: 'Two full-body workouts, alternated three days a week.',
    daysPerWeek: 3,
    restSeconds: 90,
    week: ['beg-a', null, 'beg-b', null, 'beg-a', null, null],
    rotation: ['beg-a', 'beg-b'],
    guidance: [
      '2–3 sets of 10–12 reps. Pick a weight you could lift 2–3 more times with good form.',
      'Rest about 90 seconds between sets.',
      'When you hit every rep on every set, go up a little (1–2 kg) next time.',
      'Leave a rest day between sessions; walking on rest days is great.',
    ],
    routines: [
      {
        key: 'beg-a',
        name: 'Beginner Full Body A',
        notes: 'Squat, press and row: the basics, done well.',
        items: [
          { id: ex.gobletSquat, sets: 3, reps: 10 },
          { id: ex.dbBench, sets: 3, reps: 10 },
          { id: ex.dbRow, sets: 3, reps: 10 },
          { id: ex.gluteBridge, sets: 2, reps: 12 },
          { id: ex.plank, sets: 2, seconds: 20 },
        ],
      },
      {
        key: 'beg-b',
        name: 'Beginner Full Body B',
        notes: 'Hinge, push-up and overhead press.',
        items: [
          { id: ex.dbRdl, sets: 3, reps: 10 },
          { id: ex.kneelingPushUp, sets: 3, reps: 8 },
          { id: ex.dbShoulderPress, sets: 3, reps: 10 },
          { id: ex.walkingLunge, sets: 2, reps: 10 },
          { id: ex.deadBug, sets: 2, reps: 10 },
        ],
      },
    ],
  },
  {
    level: 'intermediate',
    name: 'Upper / Lower',
    summary: 'Four days a week: upper body and lower body, twice each.',
    daysPerWeek: 4,
    restSeconds: 90,
    week: ['int-upper', 'int-lower', null, 'int-upper', 'int-lower', null, null],
    rotation: ['int-upper', 'int-lower'],
    guidance: [
      '3–4 sets of 8–12 reps.',
      'Rest 90 seconds on smaller exercises, up to 2 minutes on squats and presses.',
      'Double progression: add reps until you reach the top of the range, then add weight.',
    ],
    routines: [
      {
        key: 'int-upper',
        name: 'Intermediate Upper',
        notes: 'Chest, back, shoulders and arms.',
        items: [
          { id: ex.dbBench, sets: 4, reps: 8 },
          { id: ex.dbRow, sets: 4, reps: 10 },
          { id: ex.pullUp, sets: 3, reps: 6 },
          { id: ex.dbShoulderPress, sets: 3, reps: 10 },
          { id: ex.dbLateral, sets: 3, reps: 12 },
          { id: ex.dbHammer, sets: 3, reps: 12 },
          { id: ex.dbTricepsSeated, sets: 3, reps: 12 },
        ],
      },
      {
        key: 'int-lower',
        name: 'Intermediate Lower',
        notes: 'Legs, glutes and core.',
        items: [
          { id: ex.gobletSquat, sets: 4, reps: 10 },
          { id: ex.dbRdl, sets: 4, reps: 10 },
          { id: ex.dbSplitSquat, sets: 3, reps: 10 },
          { id: ex.dbStepUp, sets: 3, reps: 10 },
          { id: ex.dbCalf, sets: 3, reps: 15 },
          { id: ex.hangingLegRaise, sets: 3, reps: 10 },
        ],
      },
    ],
  },
  {
    level: 'advanced',
    name: 'Push / Pull / Legs',
    summary: 'Five days a week, cycling push, pull and legs.',
    daysPerWeek: 5,
    restSeconds: 120,
    week: ['adv-push', 'adv-pull', 'adv-legs', null, 'adv-push', 'adv-pull', null],
    rotation: ['adv-push', 'adv-pull', 'adv-legs'],
    guidance: [
      '4 sets of 6–12 reps; take the last set close to failure.',
      'Rest about 2 minutes on compound lifts, 60–90 seconds on isolation work.',
      'Watch your estimated 1-rep max on each exercise page to check you are progressing.',
    ],
    routines: [
      {
        key: 'adv-push',
        name: 'Advanced Push',
        notes: 'Chest, shoulders and triceps.',
        items: [
          { id: ex.dbBench, sets: 4, reps: 8 },
          { id: ex.dbIncline, sets: 4, reps: 10 },
          { id: ex.dbShoulderPress, sets: 4, reps: 8 },
          { id: ex.dbFly, sets: 3, reps: 12 },
          { id: ex.dbLateral, sets: 4, reps: 12 },
          { id: ex.dip, sets: 3, reps: 12 },
          { id: ex.dbTricepsLying, sets: 3, reps: 12 },
        ],
      },
      {
        key: 'adv-pull',
        name: 'Advanced Pull',
        notes: 'Back, rear delts and biceps.',
        items: [
          { id: ex.pullUp, sets: 4, reps: 8 },
          { id: ex.dbRow, sets: 4, reps: 10 },
          { id: ex.invertedRow, sets: 3, reps: 12 },
          { id: ex.dbReverseFly, sets: 3, reps: 15 },
          { id: ex.dbShrug, sets: 3, reps: 15 },
          { id: ex.dbCurl, sets: 3, reps: 12 },
          { id: ex.dbHammer, sets: 3, reps: 12 },
        ],
      },
      {
        key: 'adv-legs',
        name: 'Advanced Legs',
        notes: 'Quads, hamstrings, glutes, calves and core.',
        items: [
          { id: ex.gobletSquat, sets: 4, reps: 12 },
          { id: ex.dbRdl, sets: 4, reps: 10 },
          { id: ex.dbSplitSquat, sets: 4, reps: 10 },
          { id: ex.dbStepUp, sets: 3, reps: 12 },
          { id: ex.jumpSquat, sets: 3, reps: 10 },
          { id: ex.dbCalf, sets: 4, reps: 15 },
          { id: ex.hangingLegRaise, sets: 3, reps: 12 },
        ],
      },
    ],
  },
  {
    level: 'seasoned',
    name: 'PPL × 2: Strength + Volume',
    summary: 'Six days a week: a heavy push/pull/legs block, then a high-volume one.',
    daysPerWeek: 6,
    restSeconds: 120,
    week: ['sea-push-s', 'sea-pull-s', 'sea-legs-s', 'sea-push-v', 'sea-pull-v', 'sea-legs-v', null],
    rotation: ['sea-push-s', 'sea-pull-s', 'sea-legs-s', 'sea-push-v', 'sea-pull-v', 'sea-legs-v'],
    guidance: [
      'Strength days: heavy 5×5, rest 2–3 minutes.',
      'Volume days: 4 × 12–15, rest 60–90 seconds.',
      'Take a lighter deload week every 6–8 weeks.',
      'Sleep and food matter as much as the training at this volume.',
    ],
    routines: [
      {
        key: 'sea-push-s',
        name: 'Seasoned Push: Strength',
        notes: 'Heavy pressing.',
        items: [
          { id: ex.dbBench, sets: 5, reps: 5 },
          { id: ex.dbShoulderPress, sets: 5, reps: 5 },
          { id: ex.weightedDip, sets: 4, reps: 6 },
          { id: ex.archerPushUp, sets: 3, reps: 8 },
          { id: ex.dbLateral, sets: 3, reps: 12 },
        ],
      },
      {
        key: 'sea-pull-s',
        name: 'Seasoned Pull: Strength',
        notes: 'Heavy pulling and hinging.',
        items: [
          { id: ex.archerPullUp, sets: 4, reps: 5 },
          { id: ex.dbRow, sets: 5, reps: 6 },
          { id: ex.dbDeadlift, sets: 4, reps: 6 },
          { id: ex.dbShrug, sets: 3, reps: 10 },
          { id: ex.dbHammer, sets: 3, reps: 8 },
        ],
      },
      {
        key: 'sea-legs-s',
        name: 'Seasoned Legs: Strength',
        notes: 'Heavy single-leg and hinge work.',
        items: [
          { id: ex.gobletSquat, sets: 5, reps: 6 },
          { id: ex.pistolSquat, sets: 4, reps: 5 },
          { id: ex.dbRdl, sets: 5, reps: 6 },
          { id: ex.dbSplitSquat, sets: 4, reps: 6 },
          { id: ex.dbCalf, sets: 4, reps: 12 },
        ],
      },
      {
        key: 'sea-push-v',
        name: 'Seasoned Push: Volume',
        notes: 'Higher reps, shorter rest.',
        items: [
          { id: ex.dbIncline, sets: 4, reps: 12 },
          { id: ex.dbFly, sets: 4, reps: 15 },
          { id: ex.clapPushUp, sets: 3, reps: 10 },
          { id: ex.dbLateral, sets: 4, reps: 15 },
          { id: ex.dbTricepsLying, sets: 4, reps: 12 },
          { id: ex.dbKickback, sets: 3, reps: 15 },
        ],
      },
      {
        key: 'sea-pull-v',
        name: 'Seasoned Pull: Volume',
        notes: 'Higher reps, shorter rest.',
        items: [
          { id: ex.pullUp, sets: 4, reps: 10 },
          { id: ex.dbRow, sets: 4, reps: 12 },
          { id: ex.invertedRow, sets: 4, reps: 15 },
          { id: ex.dbReverseFly, sets: 4, reps: 15 },
          { id: ex.dbCurl, sets: 4, reps: 12 },
          { id: ex.dbHammer, sets: 3, reps: 15 },
        ],
      },
      {
        key: 'sea-legs-v',
        name: 'Seasoned Legs: Volume',
        notes: 'Conditioning finish.',
        items: [
          { id: ex.dbLunge, sets: 4, reps: 12 },
          { id: ex.dbStepUp, sets: 4, reps: 12 },
          { id: ex.jumpSquat, sets: 4, reps: 12 },
          { id: ex.benchGluteBridge, sets: 4, reps: 15 },
          { id: ex.dbCalf, sets: 4, reps: 20 },
          { id: ex.kbSwing, sets: 4, reps: 20 },
          { id: ex.burpee, sets: 3, reps: 12 },
        ],
      },
    ],
  },
];

/** Standalone routines for days away from the plan. */
export const EXTRA_ROUTINES: StarterRoutine[] = [
  {
    key: 'bodyweight-circuit',
    level: 'beginner',
    name: 'Bodyweight Home Circuit',
    notes: 'No equipment. Move briskly between exercises, rest 60 seconds between rounds.',
    items: [
      { id: ex.pushUp, sets: 3, reps: 12 },
      { id: ex.bodyweightSquat, sets: 3, reps: 15 },
      { id: ex.walkingLunge, sets: 3, reps: 12 },
      { id: ex.gluteBridge, sets: 3, reps: 15 },
      { id: ex.mountainClimber, sets: 3, seconds: 30 },
      { id: ex.plank, sets: 3, seconds: 30 },
      { id: ex.burpee, sets: 3, reps: 8 },
    ],
  },
  {
    key: 'band-total-body',
    level: 'beginner',
    name: 'Resistance Band Total Body',
    notes: 'Just a band. Good for travel or a quiet session at home.',
    items: [
      { id: ex.bandSquat, sets: 3, reps: 15 },
      { id: ex.bandChestPress, sets: 3, reps: 12 },
      { id: ex.bandRow, sets: 3, reps: 12 },
      { id: ex.bandShoulderPress, sets: 3, reps: 12 },
      { id: ex.bandRdl, sets: 3, reps: 12 },
      { id: ex.bandCurl, sets: 3, reps: 12 },
    ],
  },
  {
    key: 'kettlebell-express',
    level: 'intermediate',
    name: 'Kettlebell Express',
    notes: 'One kettlebell, about 20 minutes.',
    items: [
      { id: ex.kbSwing, sets: 4, reps: 15 },
      { id: ex.kbGobletSquat, sets: 3, reps: 12 },
      { id: ex.kbRow, sets: 3, reps: 10 },
      { id: ex.kbPress, sets: 3, reps: 10 },
      { id: ex.plank, sets: 3, seconds: 30 },
    ],
  },
];

export const STARTER_ROUTINES: StarterRoutine[] = [
  ...PROGRAMS.flatMap((p) => p.routines.map((r) => ({ ...r, level: p.level }))),
  ...EXTRA_ROUTINES,
];

export function programFor(level: Level | null | undefined) {
  return PROGRAMS.find((p) => p.level === level) ?? null;
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
