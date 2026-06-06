import fs from 'fs';
import os from 'os';
import path from 'path';

const MAX_ENTRIES = 10;

function recentFilePath() {
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return path.join(base, 'zsm', 'recent.json');
  }
  return path.join(os.homedir(), '.cache', 'zsm', 'recent.json');
}

function readEntries() {
  try {
    const file = recentFilePath();
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function writeEntries(entries) {
  const file = recentFilePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(entries.slice(0, MAX_ENTRIES), null, 2), 'utf-8');
}

export function addRecentExport({ slug, colour, outputPath, score }) {
  const entries = readEntries().filter((e) => e.outputPath !== outputPath);
  entries.unshift({
    slug,
    colour: colour ?? null,
    outputPath,
    score: Math.round(score),
    timestamp: new Date().toISOString(),
  });
  writeEntries(entries);
}

export function getRecentExports() {
  return readEntries();
}

export function getRecentExport(index) {
  const entries = readEntries();
  const i = index - 1;
  if (i < 0 || i >= entries.length) return null;
  return entries[i];
}
