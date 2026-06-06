import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConfiguredOutputDir } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..');

export function iconsDir() {
  return path.join(PACKAGE_ROOT, 'icons');
}

/** Export destination: config, env, or Downloads */
export function outputDir() {
  return getConfiguredOutputDir() ?? path.join(os.homedir(), 'Downloads');
}

export function ensureOutputDir() {
  const out = outputDir();
  fs.mkdirSync(out, { recursive: true });
  return out;
}
