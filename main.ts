// Ember Sigils — the handoff program (Node 22, standard library only).
//
// This file hands the game in. The game itself lives in game/ beside this file:
// plain static files (game/index.html and its ES modules) that a desktop browser
// opens offline, no network request. The screenshots in screenshots/ are real
// renders of that game, the first by name the cover. Running this program copies
// both folders to the output directory (MAKEFUN_OUTPUT_DIR outside the grader,
// /output inside it) and writes dossier.json there — the summary the judge reads,
// produced by the vendored make.fun library from the copied files. The dossier is
// deterministic: the same game and screenshots always write the same bytes.
//
// Before anything is copied, the program checks the entry is whole (a page to
// open, three or four screenshots) and stops loudly when it is not, instead of
// handing in a broken entry. Afterwards it prints a short summary of what went
// out: how many game files and screenshots were copied and how big the dossier is.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Where this file lives (the repository root) and where the entry goes.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps, from the kit's gate: only text_max_bytes shapes the dossier's
// bytes; the rest make this program refuse an entry the scorer would refuse.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// How many screenshots an entry holds: three or four, no fewer and no more.
const MIN_SCREENSHOTS = 3;
const MAX_SCREENSHOTS = 4;

/** Stop with a message and a non-zero exit, instead of handing in a broken entry. */
function fail(message: string): never {
  throw new Error(`main.ts: ${message}`);
}

/** The image files of a directory, by name (PNG or JPEG only, dotfiles skipped). */
function imageFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.') && /\.(png|jpe?g)$/i.test(name))
    .sort();
}

/** How many files a directory tree holds, directories included. */
function entryCount(dir: string): number {
  let n = 0;
  const walk = (at: string): void => {
    for (const name of readdirSync(at)) {
      n++;
      const path = join(at, name);
      if (statSync(path).isDirectory()) walk(path);
    }
  };
  walk(dir);
  return n;
}

/** Check the entry is whole before anything is copied. */
function validateEntry(): { shots: string[] } {
  const gameDir = join(repoRoot, 'game');
  const page = join(gameDir, 'index.html');
  if (!existsSync(page) || !statSync(page).isFile()) {
    fail('game/index.html is missing: the game needs a page to open');
  }
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
    fail('screenshots/ is missing: an entry needs three or four screenshots');
  }
  const shots = imageFiles(shotsDir);
  if (shots.length < MIN_SCREENSHOTS || shots.length > MAX_SCREENSHOTS) {
    fail(`screenshots/ holds ${shots.length} images, an entry needs ${MIN_SCREENSHOTS} to ${MAX_SCREENSHOTS}`);
  }
  return { shots };
}

/** Copy one folder of the repository into the output directory, making it first. */
function copyFolder(name: string): void {
  const target = join(outDir, name);
  mkdirSync(target, { recursive: true });
  cpSync(join(repoRoot, name), target, { recursive: true });
}

/** Hand the entry in: validate, copy, write the dossier, and say what went out. */
function handIn(): void {
  const { shots } = validateEntry();
  mkdirSync(outDir, { recursive: true });
  copyFolder('game');
  copyFolder('screenshots');
  const dossier = buildDossier(outDir, dossierCaps);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  const gameEntries = entryCount(join(outDir, 'game'));
  console.log(
    `handed in ${gameEntries} game entries and ${shots.length} screenshots ` +
      `(${shots.join(', ')}) to ${outDir}; dossier.json is ${dossier.length} bytes`,
  );
}

try {
  handIn();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
