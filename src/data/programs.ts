// Training plans per experience level, plus standalone routines for each level.
// Their routines are seeded into the database (see db/schema.ts) and are
// ordinary, editable routines after that. Exercise ids are ExerciseDB ids.
//
// Programs assume a condo gym: dumbbells, a bench and a pull-up bar. Some
// standalone routines need a barbell, kettlebell or gym machines; their notes say so.

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
export type StarterRoutine = {
  key: string;
  name: string;
  notes: string;
  level: Level;
  items: StarterItem[];
  /**
   * Index of the migration that seeds this routine (db/schema.ts). Routines
   * added after launch get the migration that shipped them, so existing installs
   * receive them once; omitted means the launch set.
   */
  since?: number;
};

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

  dbSquat: 'HsvHqgf',
  dbSingleRow: 'C0MA9bC',
  dbArnold: 'eOrFCnx',
  dbInclineCurl: 'ae9UoXQ',
  dbRearLunge: 'SSsBDwB',
  dbSingleLegDeadlift: 'gKozT8X',
  dbSingleCalf: '1kB3Wmk',
  dbPushPress: 'FS63wTN',
  dbClean: '7Hg55JG',
  farmersWalk: 'qPEzJjA',
  chinUp: 'T2mxWqc',
  chestDip: '9WTm7dq',
  benchDip: 'RrLske5',
  inclinePushUp: 'B1EVP9F',
  declinePushUp: 'i5cEhka',
  handstandPushUp: 'rQxwMxO',
  splitSquat: '9E25EOx',
  forwardLunge: 'kMzUs9Y',
  jumpLunge: 'PM1PZjg',
  singleLegBridge: 'rmEukuS',
  gluteBridgeMarch: 'GibBPPg',
  bodyweightCalf: 'bJYHBIN',
  sidePlank: 'RKjH6Lt',
  bicycleCrunch: '1ZFqTDN',
  skaterHops: 'zfNHMN9',
  weightedPullUp: 'HMzLjXx',
  kbFrontSquat: 'DB0n8AG',
  kbSingleRow: 'g9AsZ8P',
  kbFloorPress: 'rg59QCH',
  kbPushPress: 'osdXT3K',
  kbThruster: 'yWxMvB5',
  kbGetUp: 'Ha7SZ3y',
  kbSnatch: 'aXcUyKb',
  bbSquat: 'qXTaZnJ',
  bbFrontSquat: 'zG0zs85',
  bbBench: 'EIeI8Vf',
  bbCloseBench: 'J6Dx1Mu',
  bbPress: 'Kyd9Rz5',
  bbRow: 'eZyBC3j',
  bbPendlayRow: 'r0z6xzQ',
  bbDeadlift: 'ila4NZS',
  bbRdl: 'wQ2c4XD',
  bbLunge: 't8iSghb',
  bbGluteBridge: 'qKBpF7I',
  bbCalf: '8ozhUIZ',
  bbShrug: 'dG7tG5y',
  bbCurl: '25GPyDY',
  bbSkullCrusher: 'h8LFzo9',
  ezCurl: '6TG6x2w',
  legPress: '10Z2DXU',
  legCurl: 'Zg3XY7P',
  latPulldown: 'eYnzaCm',
  cableRow: 'hvV79Si',
  machineChestPress: 'DOoWcnA',
  cableLateral: 'goJ6ezq',
  cablePushdown: '3ZflifB',
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
    summary: 'Four days a week: upper body and lower body twice each, alternating A and B workouts.',
    daysPerWeek: 4,
    restSeconds: 90,
    week: ['int-upper', 'int-lower', null, 'int-upper-b', 'int-lower-b', null, null],
    rotation: ['int-upper', 'int-lower', 'int-upper-b', 'int-lower-b'],
    guidance: [
      '3–4 sets of 8–12 reps.',
      'A days lean heavier; B days swap in different exercises for the same muscles.',
      'Rest 90 seconds on smaller exercises, up to 2 minutes on squats and presses.',
      'Double progression: add reps until you reach the top of the range, then add weight.',
      'Log the weight on every set so next session shows what to beat.',
    ],
    routines: [
      {
        key: 'int-upper',
        name: 'Intermediate Upper A',
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
        name: 'Intermediate Lower A',
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
      {
        key: 'int-upper-b',
        name: 'Intermediate Upper B',
        notes: 'Incline pressing, chin-ups and single-arm rows, with a little more volume than A.',
        since: 1,
        items: [
          { id: ex.dbIncline, sets: 4, reps: 10 },
          { id: ex.chinUp, sets: 4, reps: 8 },
          { id: ex.dbSingleRow, sets: 3, reps: 10 },
          { id: ex.dbArnold, sets: 3, reps: 10 },
          { id: ex.dbReverseFly, sets: 3, reps: 15 },
          { id: ex.dbInclineCurl, sets: 3, reps: 12 },
          { id: ex.dbTricepsLying, sets: 3, reps: 12 },
        ],
      },
      {
        key: 'int-lower-b',
        name: 'Intermediate Lower B',
        notes: 'Deadlifts, squats and single-leg work for strength and balance.',
        since: 1,
        items: [
          { id: ex.dbDeadlift, sets: 4, reps: 8 },
          { id: ex.dbSquat, sets: 4, reps: 10 },
          { id: ex.dbRearLunge, sets: 3, reps: 10 },
          { id: ex.dbSingleLegDeadlift, sets: 3, reps: 10 },
          { id: ex.singleLegBridge, sets: 3, reps: 12 },
          { id: ex.dbSingleCalf, sets: 3, reps: 12 },
          { id: ex.plank, sets: 3, seconds: 45 },
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

function withSince(since: number, routines: StarterRoutine[]) {
  return routines.map((r) => ({ ...r, since }));
}

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
  ...withSince(1, [
    // ----- Beginner -----
    {
      key: 'beg-dumbbell-full-body',
      level: 'beginner',
      name: 'Dumbbell Full Body Starter',
      notes: 'A pair of light dumbbells, every major muscle. Start lighter than you think and own the form.',
      items: [
        { id: ex.dbSquat, sets: 3, reps: 10 },
        { id: ex.dbIncline, sets: 3, reps: 10 },
        { id: ex.dbSingleRow, sets: 3, reps: 10 },
        { id: ex.dbRdl, sets: 3, reps: 10 },
        { id: ex.dbLateral, sets: 2, reps: 12 },
        { id: ex.dbCurl, sets: 2, reps: 12 },
        { id: ex.plank, sets: 2, seconds: 30 },
      ],
    },
    {
      key: 'beg-upper-body',
      level: 'beginner',
      name: 'Beginner Upper Body',
      notes: 'Push, pull and arms. Incline push-ups on a bench make the movement easier to learn.',
      items: [
        { id: ex.inclinePushUp, sets: 3, reps: 10 },
        { id: ex.dbRow, sets: 3, reps: 10 },
        { id: ex.dbShoulderPress, sets: 3, reps: 10 },
        { id: ex.benchDip, sets: 2, reps: 10 },
        { id: ex.dbHammer, sets: 2, reps: 12 },
        { id: ex.deadBug, sets: 2, reps: 10 },
      ],
    },
    {
      key: 'beg-legs-core',
      level: 'beginner',
      name: 'Beginner Legs & Core',
      notes: 'Mostly bodyweight; hold dumbbells on the step-ups once they feel easy.',
      items: [
        { id: ex.bodyweightSquat, sets: 3, reps: 15 },
        { id: ex.dbStepUp, sets: 3, reps: 10 },
        { id: ex.gluteBridge, sets: 3, reps: 12 },
        { id: ex.forwardLunge, sets: 2, reps: 10 },
        { id: ex.bodyweightCalf, sets: 3, reps: 15 },
        { id: ex.sidePlank, sets: 2, seconds: 20 },
        { id: ex.bicycleCrunch, sets: 2, reps: 16 },
      ],
    },
    {
      key: 'beg-kettlebell-basics',
      level: 'beginner',
      name: 'Kettlebell Basics',
      notes: 'One kettlebell. Keep swings light and snappy: the push comes from your hips, not your arms.',
      items: [
        { id: ex.kbGobletSquat, sets: 3, reps: 10 },
        { id: ex.kbSingleRow, sets: 3, reps: 10 },
        { id: ex.kbFloorPress, sets: 3, reps: 10 },
        { id: ex.kbSwing, sets: 3, reps: 12 },
        { id: ex.gluteBridgeMarch, sets: 2, reps: 12 },
        { id: ex.plank, sets: 2, seconds: 30 },
      ],
    },

    // ----- Intermediate -----
    {
      key: 'int-push',
      level: 'intermediate',
      name: 'Intermediate Push',
      notes: 'Chest, shoulders and triceps with dumbbells and dips.',
      items: [
        { id: ex.dbBench, sets: 4, reps: 8 },
        { id: ex.dbIncline, sets: 3, reps: 10 },
        { id: ex.dbArnold, sets: 3, reps: 10 },
        { id: ex.dbLateral, sets: 3, reps: 15 },
        { id: ex.chestDip, sets: 3, reps: 10 },
        { id: ex.dbTricepsLying, sets: 3, reps: 12 },
      ],
    },
    {
      key: 'int-pull',
      level: 'intermediate',
      name: 'Intermediate Pull',
      notes: 'Back, rear delts and biceps.',
      items: [
        { id: ex.pullUp, sets: 4, reps: 6 },
        { id: ex.dbSingleRow, sets: 4, reps: 10 },
        { id: ex.invertedRow, sets: 3, reps: 12 },
        { id: ex.dbReverseFly, sets: 3, reps: 15 },
        { id: ex.dbShrug, sets: 3, reps: 12 },
        { id: ex.dbInclineCurl, sets: 3, reps: 12 },
        { id: ex.dbHammer, sets: 2, reps: 12 },
      ],
    },
    {
      key: 'int-legs',
      level: 'intermediate',
      name: 'Intermediate Legs & Glutes',
      notes: 'A full leg day with dumbbells: squat, hinge, lunge, then calves and core.',
      items: [
        { id: ex.dbSquat, sets: 4, reps: 10 },
        { id: ex.dbRdl, sets: 4, reps: 10 },
        { id: ex.dbRearLunge, sets: 3, reps: 10 },
        { id: ex.dbStepUp, sets: 3, reps: 10 },
        { id: ex.singleLegBridge, sets: 3, reps: 12 },
        { id: ex.dbCalf, sets: 4, reps: 15 },
        { id: ex.hangingLegRaise, sets: 3, reps: 10 },
      ],
    },
    {
      key: 'int-arms-shoulders',
      level: 'intermediate',
      name: 'Arms & Shoulders',
      notes: 'Dumbbell isolation work. Good as a fifth day or when you are short on time.',
      items: [
        { id: ex.dbArnold, sets: 4, reps: 10 },
        { id: ex.dbLateral, sets: 4, reps: 15 },
        { id: ex.dbReverseFly, sets: 3, reps: 15 },
        { id: ex.dbCurl, sets: 3, reps: 12 },
        { id: ex.dbTricepsSeated, sets: 3, reps: 12 },
        { id: ex.dbHammer, sets: 3, reps: 12 },
        { id: ex.dbKickback, sets: 3, reps: 15 },
      ],
    },
    {
      key: 'int-dumbbell-power',
      level: 'intermediate',
      name: 'Dumbbell Full Body Power',
      notes: 'Explosive cleans and push presses first, while you are fresh, then strength work and a loaded carry.',
      items: [
        { id: ex.dbClean, sets: 4, reps: 6 },
        { id: ex.dbPushPress, sets: 4, reps: 8 },
        { id: ex.dbSquat, sets: 3, reps: 12 },
        { id: ex.dbSingleRow, sets: 3, reps: 10 },
        { id: ex.dbSingleLegDeadlift, sets: 3, reps: 10 },
        { id: ex.farmersWalk, sets: 3, seconds: 40 },
      ],
    },
    {
      key: 'int-barbell-a',
      level: 'intermediate',
      name: 'Barbell Strength A',
      notes: 'Needs a barbell, rack and bench. Alternate with B; add 2.5 kg (5 lb) next time when every rep is clean.',
      items: [
        { id: ex.bbSquat, sets: 5, reps: 5 },
        { id: ex.bbBench, sets: 5, reps: 5 },
        { id: ex.bbRow, sets: 5, reps: 5 },
        { id: ex.hangingLegRaise, sets: 3, reps: 10 },
      ],
    },
    {
      key: 'int-barbell-b',
      level: 'intermediate',
      name: 'Barbell Strength B',
      notes: 'Needs a barbell and rack. Alternate with A; rest 2–3 minutes between heavy sets.',
      items: [
        { id: ex.bbSquat, sets: 5, reps: 5 },
        { id: ex.bbPress, sets: 5, reps: 5 },
        { id: ex.bbDeadlift, sets: 3, reps: 5 },
        { id: ex.chinUp, sets: 3, reps: 8 },
      ],
    },
    {
      key: 'int-kettlebell-strength',
      level: 'intermediate',
      name: 'Kettlebell Strength & Conditioning',
      notes: 'One or two kettlebells. Heavier than Kettlebell Express, with a Turkish get-up to finish (reps per side).',
      items: [
        { id: ex.kbSwing, sets: 5, reps: 15 },
        { id: ex.kbFrontSquat, sets: 4, reps: 8 },
        { id: ex.kbSingleRow, sets: 4, reps: 10 },
        { id: ex.kbPushPress, sets: 4, reps: 8 },
        { id: ex.kbThruster, sets: 3, reps: 10 },
        { id: ex.kbGetUp, sets: 3, reps: 3 },
      ],
    },
    {
      key: 'int-calisthenics',
      level: 'intermediate',
      name: 'Calisthenics Strength',
      notes: 'Bodyweight only: a pull-up bar and dip station. Switch an exercise to "+ Weight" once you can beat the reps.',
      items: [
        { id: ex.pullUp, sets: 4, reps: 8 },
        { id: ex.chestDip, sets: 4, reps: 10 },
        { id: ex.declinePushUp, sets: 3, reps: 12 },
        { id: ex.invertedRow, sets: 3, reps: 12 },
        { id: ex.splitSquat, sets: 3, reps: 12 },
        { id: ex.jumpLunge, sets: 3, reps: 10 },
        { id: ex.hangingLegRaise, sets: 3, reps: 10 },
      ],
    },
    {
      key: 'int-gym-machines',
      level: 'intermediate',
      name: 'Gym Machines & Cables',
      notes: 'For a full gym: leg press, lat pulldown, chest press and cable stack.',
      items: [
        { id: ex.legPress, sets: 4, reps: 12 },
        { id: ex.latPulldown, sets: 4, reps: 10 },
        { id: ex.machineChestPress, sets: 3, reps: 10 },
        { id: ex.cableRow, sets: 3, reps: 12 },
        { id: ex.legCurl, sets: 3, reps: 12 },
        { id: ex.cableLateral, sets: 3, reps: 15 },
        { id: ex.cablePushdown, sets: 3, reps: 12 },
      ],
    },
    {
      key: 'int-conditioning',
      level: 'intermediate',
      name: 'Conditioning Circuit',
      notes: 'One kettlebell. Go round the circuit with little rest, then rest 90 seconds between rounds.',
      items: [
        { id: ex.kbSwing, sets: 4, reps: 20 },
        { id: ex.burpee, sets: 4, reps: 10 },
        { id: ex.mountainClimber, sets: 4, seconds: 30 },
        { id: ex.skaterHops, sets: 4, reps: 20 },
        { id: ex.jumpSquat, sets: 4, reps: 12 },
        { id: ex.plank, sets: 3, seconds: 45 },
      ],
    },

    // ----- Advanced -----
    {
      key: 'adv-barbell-upper',
      level: 'advanced',
      name: 'Advanced Barbell Upper',
      notes: 'Needs a barbell, rack and bench. Heavy presses and rows, then weighted pull-ups.',
      items: [
        { id: ex.bbBench, sets: 5, reps: 5 },
        { id: ex.bbPendlayRow, sets: 5, reps: 5 },
        { id: ex.bbPress, sets: 4, reps: 6 },
        { id: ex.weightedPullUp, sets: 4, reps: 6 },
        { id: ex.bbCloseBench, sets: 3, reps: 8 },
        { id: ex.bbCurl, sets: 3, reps: 10 },
      ],
    },
    {
      key: 'adv-barbell-lower',
      level: 'advanced',
      name: 'Advanced Barbell Lower',
      notes: 'Needs a barbell and rack. Squat heavy, then hinge, lunge and bridge.',
      items: [
        { id: ex.bbSquat, sets: 5, reps: 5 },
        { id: ex.bbRdl, sets: 4, reps: 8 },
        { id: ex.bbLunge, sets: 3, reps: 10 },
        { id: ex.bbGluteBridge, sets: 4, reps: 10 },
        { id: ex.bbCalf, sets: 4, reps: 12 },
        { id: ex.hangingLegRaise, sets: 4, reps: 12 },
      ],
    },
    {
      key: 'adv-calisthenics',
      level: 'advanced',
      name: 'Advanced Calisthenics',
      notes: 'Hard bodyweight progressions. Use a wall for handstand push-ups.',
      items: [
        { id: ex.archerPullUp, sets: 4, reps: 5 },
        { id: ex.archerPushUp, sets: 4, reps: 8 },
        { id: ex.chestDip, sets: 4, reps: 12 },
        { id: ex.pistolSquat, sets: 4, reps: 6 },
        { id: ex.handstandPushUp, sets: 3, reps: 5 },
        { id: ex.hangingLegRaise, sets: 4, reps: 12 },
      ],
    },
    {
      key: 'adv-metcon',
      level: 'advanced',
      name: 'Advanced Metcon',
      notes: 'One kettlebell. Fast and demanding; keep form tight as you tire.',
      items: [
        { id: ex.kbSnatch, sets: 5, reps: 10 },
        { id: ex.kbThruster, sets: 4, reps: 12 },
        { id: ex.burpee, sets: 4, reps: 15 },
        { id: ex.jumpLunge, sets: 4, reps: 12 },
        { id: ex.kbSwing, sets: 4, reps: 20 },
        { id: ex.mountainClimber, sets: 3, seconds: 40 },
      ],
    },

    // ----- Seasoned -----
    {
      key: 'sea-deadlift',
      level: 'seasoned',
      name: 'Seasoned Deadlift & Back',
      notes: 'Needs a barbell. Heavy triples on the deadlift, then rows and weighted pull-ups.',
      items: [
        { id: ex.bbDeadlift, sets: 5, reps: 3 },
        { id: ex.bbRdl, sets: 3, reps: 8 },
        { id: ex.bbPendlayRow, sets: 4, reps: 6 },
        { id: ex.weightedPullUp, sets: 4, reps: 5 },
        { id: ex.bbShrug, sets: 4, reps: 10 },
        { id: ex.hangingLegRaise, sets: 4, reps: 12 },
      ],
    },
    {
      key: 'sea-squat-press',
      level: 'seasoned',
      name: 'Seasoned Squat & Press',
      notes: 'Needs a barbell and rack. Heavy back squat triples, front squats, then overhead pressing.',
      items: [
        { id: ex.bbSquat, sets: 5, reps: 3 },
        { id: ex.bbFrontSquat, sets: 3, reps: 6 },
        { id: ex.bbPress, sets: 5, reps: 5 },
        { id: ex.weightedDip, sets: 4, reps: 8 },
        { id: ex.bbCalf, sets: 4, reps: 12 },
      ],
    },
    {
      key: 'sea-arms',
      level: 'seasoned',
      name: 'Seasoned Arms & Delts',
      notes: 'High-volume arm and shoulder day. Uses a barbell, EZ bar, dumbbells and a cable.',
      items: [
        { id: ex.bbCloseBench, sets: 4, reps: 8 },
        { id: ex.ezCurl, sets: 4, reps: 10 },
        { id: ex.bbSkullCrusher, sets: 3, reps: 12 },
        { id: ex.dbInclineCurl, sets: 3, reps: 12 },
        { id: ex.cablePushdown, sets: 3, reps: 15 },
        { id: ex.dbHammer, sets: 3, reps: 15 },
        { id: ex.dbLateral, sets: 4, reps: 20 },
      ],
    },
  ]),
];

export const STARTER_ROUTINES: StarterRoutine[] = [
  ...PROGRAMS.flatMap((p) => p.routines.map((r) => ({ ...r, level: p.level }))),
  ...EXTRA_ROUTINES,
];

const STARTER_ORDER = new Map(STARTER_ROUTINES.map((r, i) => [r.key, i]));

/** Sorts starter routines into the order they're listed here, others last. */
export function byStarterOrder(a: { starter_key: string | null }, b: { starter_key: string | null }) {
  const at = a.starter_key ? (STARTER_ORDER.get(a.starter_key) ?? Infinity) : Infinity;
  const bt = b.starter_key ? (STARTER_ORDER.get(b.starter_key) ?? Infinity) : Infinity;
  return at - bt;
}

export function programFor(level: Level | null | undefined) {
  return PROGRAMS.find((p) => p.level === level) ?? null;
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
