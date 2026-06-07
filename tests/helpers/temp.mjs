import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

export function createTempDir() {
  return mkdtempSync(path.join(tmpdir(), 'zsm-test-'));
}

export function removeTempDir(dir) {
  rmSync(dir, { recursive: true, force: true });
}

export function isolateUserDataDir(dir) {
  const saved = {};
  if (process.platform === 'win32') {
    saved.LOCALAPPDATA = process.env.LOCALAPPDATA;
    saved.APPDATA = process.env.APPDATA;
    process.env.LOCALAPPDATA = dir;
    process.env.APPDATA = path.join(dir, 'Roaming');
  } else {
    saved.HOME = process.env.HOME;
    process.env.HOME = dir;
  }
  return () => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}
