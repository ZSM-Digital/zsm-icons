import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BIN = path.join(ROOT, 'bin', 'zsm.js');

export function runCli(args, env = {}) {
  const result = spawnSync(process.execPath, [BIN, ...args], {
    env: { ...process.env, ...env },
    encoding: 'utf-8',
    cwd: ROOT,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

export { ROOT };
