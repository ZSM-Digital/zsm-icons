import fs from 'fs';
import os from 'os';
import path from 'path';

let cachedConfig = null;

export function configFilePath() {
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(base, 'zsm', 'config.json');
  }
  return path.join(os.homedir(), '.config', 'zsm', 'config.json');
}

function loadConfig() {
  if (cachedConfig) return cachedConfig;
  cachedConfig = {};
  try {
    const file = configFilePath();
    if (fs.existsSync(file)) {
      cachedConfig = JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch {
    cachedConfig = {};
  }
  return cachedConfig;
}

export function getConfiguredOutputDir() {
  if (process.env.ZSM_OUTPUT_DIR?.trim()) {
    return path.resolve(process.env.ZSM_OUTPUT_DIR.trim());
  }
  const config = loadConfig();
  if (config.outputDir?.trim()) {
    return path.resolve(config.outputDir.trim());
  }
  return null;
}
