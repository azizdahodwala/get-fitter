# get-fitter

Fitness tracker app for condo-gym and home workouts, built with Expo (React Native) for iPhone and Android.

## Features

- **Exercise library**: 1,500 exercises from [ExerciseDB](https://github.com/exercisedb/exercisedb-api), each with a looping
  demo animation, target muscles, equipment and step-by-step instructions. Filter by body part, search, and limit to
  the equipment you actually have. A "Watch full video on YouTube" button opens a form-video search for any exercise.
- **Plans by experience level**: Beginner (3-day full body), Intermediate (4-day upper/lower), Advanced (5-day
  push/pull/legs) and Seasoned (6-day PPL with strength and volume days). Each has a suggested week, coaching notes,
  and a "Next up" card that rotates through the plan, so a missed day just shifts it.
- **Routines**: the plan routines plus bodyweight, band and kettlebell sessions; build your own or duplicate and tweak any.
- **Workout logging**: weight × reps, reps only, or timed sets (switchable per exercise). Last session's numbers show as
  placeholders: tick a set to log them unchanged. Rest timer, live duration and volume.
- **History**: every workout with sets, reps and weights; per-exercise progress (heaviest set, estimated 1-rep max, trend chart).
- **Profile and body metrics**: level, age (from birth year), height and BMI; log weight, body-fat % and
  waist/chest/hips/arm measurements over time with trend charts.
- **Private by default**: everything is stored on the phone in SQLite. Export/import a JSON backup from the Profile tab.
- Metric or imperial units.

## Run it on your phone

Requires Node.js 20+.

```bash
npm install
npx expo start
```

Install **Expo Go** from the App Store / Play Store, make sure your phone is on the same Wi-Fi as your computer,
then scan the QR code shown in the terminal (iPhone: with the Camera app).

`npx expo start --web` runs it in a browser too, which is handy for quick checks.

## Project layout

```
src/app/          screens (Expo Router file-based routes)
  (tabs)/         Workouts, Library, History, Profile tabs
  workout/[id]    live workout logger and workout summary
  routine/        routine detail and editor
  exercise/[id]   exercise demo, instructions and your progress
  plan, onboarding, profile/edit, body/   plan, first-run setup, body metrics
src/components/   shared UI (set rows, rest timer, exercise browser, ...)
src/data/         exercise catalog (exercises.json), plans and starter routines (programs.ts)
src/db/           SQLite schema/migrations (schema.ts) and queries (repo.ts)
src/lib/          formatting, settings, backups, plan logic
scripts/          fetch-exercises.mjs: refreshes the bundled exercise catalog
```

## Exercise data

The ExerciseDB free API is rate limited and meant for exploration, so the app never calls it at runtime. The catalog is
downloaded once and bundled in `src/data/exercises.json`; the animations load from ExerciseDB's CDN and are cached on the
device after first view. To refresh the catalog:

```bash
npm run fetch-exercises
```

Starter routines reference exercises by ExerciseDB id (`src/data/programs.ts`).

## Checks

```bash
npm run typecheck
npx expo lint
```

## Notes

- Plans and guidance are general fitness information, not medical advice.
- The rest timer only runs while the app is open (no background notifications yet).
