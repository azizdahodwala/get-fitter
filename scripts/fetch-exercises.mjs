// Downloads the full ExerciseDB (free tier) catalog once and writes it as a
// compact JSON file that ships inside the app. The free API is rate limited
// and meant for exploration, so the app never calls it at runtime.
//
//   npm run fetch-exercises
//
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://oss.exercisedb.dev/api/v1/exercises';
const PAGE = 25; // API maximum
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/exercises.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getPage(after, attempt = 1) {
  const url = `${API}?limit=${PAGE}${after ? `&after=${after}` : ''}`;
  const res = await fetch(url);
  if (res.status === 429 || res.status >= 500) {
    if (attempt > 6) throw new Error(`Giving up on ${url}: HTTP ${res.status}`);
    const wait = 2000 * attempt;
    console.warn(`HTTP ${res.status}, retrying in ${wait / 1000}s`);
    await sleep(wait);
    return getPage(after, attempt + 1);
  }
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

const cleanStep = (s) => s.replace(/^Step:\s*\d+\s*/i, '').trim();

const all = [];
let after;
do {
  const { data, meta } = await getPage(after);
  all.push(...data);
  process.stdout.write(`\r${all.length}/${meta.total}`);
  after = meta.hasNextPage ? meta.nextCursor : undefined;
  await sleep(700);
} while (after);
process.stdout.write('\n');

const seen = new Set();
const exercises = all
  .filter((e) => !seen.has(e.exerciseId) && seen.add(e.exerciseId))
  .map((e) => ({
    id: e.exerciseId,
    name: e.name,
    gif: e.gifUrl,
    bodyParts: e.bodyParts,
    equipment: e.equipments,
    target: e.targetMuscles,
    secondary: e.secondaryMuscles,
    steps: e.instructions.map(cleanStep),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(exercises));
console.log(`Wrote ${exercises.length} exercises to ${OUT}. Run npm run check-gifs next.`);
