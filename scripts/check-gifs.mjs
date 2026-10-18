// Checks every demo GIF in the bundled catalog and writes the ids whose GIF is
// gone to src/data/missing-gifs.json, each mapped to a same-name entry (same
// equipment and body parts) whose GIF loads, or null if there is none. The app
// hides those ids from the library and pickers. Re-run after fetch-exercises,
// or whenever the CDN changes:
//
//   npm run check-gifs
//
// Newly missing ids also need a migration that moves existing rows off them,
// like migration 3 in src/db/schema.ts.
//
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data');
const PARALLEL = 32;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gifExists(url, attempt = 1) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) return true;
    if (res.status === 404 || res.status === 410) return false;
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    // Anything but a clear "not found" is retried, then fails the run, so a
    // flaky network can't hide working exercises.
    if (attempt > 4) throw new Error(`Giving up on ${url}: ${err.message}`);
    await sleep(1000 * attempt);
    return gifExists(url, attempt + 1);
  }
}

const exercises = JSON.parse(await readFile(resolve(DATA, 'exercises.json'), 'utf8'));

const missing = new Set();
let next = 0;
let checked = 0;
async function worker() {
  while (next < exercises.length) {
    const e = exercises[next++];
    if (!(await gifExists(e.gif))) missing.add(e.id);
    process.stdout.write(`\r${++checked}/${exercises.length}`);
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));
process.stdout.write('\n');

const sameExercise = (a, b) =>
  a.name.toLowerCase() === b.name.toLowerCase() &&
  [...a.equipment].sort().join() === [...b.equipment].sort().join() &&
  [...a.bodyParts].sort().join() === [...b.bodyParts].sort().join();

const out = {};
for (const e of exercises) {
  if (!missing.has(e.id)) continue;
  out[e.id] = exercises.find((t) => !missing.has(t.id) && sameExercise(t, e))?.id ?? null;
}

await writeFile(resolve(DATA, 'missing-gifs.json'), JSON.stringify(out, null, 2) + '\n');
const orphans = Object.values(out).filter((v) => v === null).length;
console.log(`${missing.size} of ${exercises.length} GIFs missing, ${orphans} without a working same-name entry`);
