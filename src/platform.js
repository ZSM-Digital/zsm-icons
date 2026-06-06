import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function revealInFileManager(filePath) {
  const resolved = path.resolve(filePath);
  const dir = fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved);

  if (process.platform === 'win32') {
    spawnSync('explorer', ['/select,', resolved], { stdio: 'ignore', shell: true });
  } else if (process.platform === 'darwin') {
    spawnSync('open', ['-R', resolved], { stdio: 'ignore' });
  } else {
    spawnSync('xdg-open', [dir], { stdio: 'ignore' });
  }
}

export function openFile(filePath) {
  const resolved = path.resolve(filePath);
  if (process.platform === 'win32') {
    spawnSync('cmd', ['/c', 'start', '', resolved], { stdio: 'ignore', shell: true });
  } else if (process.platform === 'darwin') {
    spawnSync('open', [resolved], { stdio: 'ignore' });
  } else {
    spawnSync('xdg-open', [resolved], { stdio: 'ignore' });
  }
}

export function copyToClipboard(text) {
  if (process.platform === 'win32') {
    spawnSync('clip', [], { input: text, stdio: ['pipe', 'ignore', 'ignore'], shell: true });
  } else if (process.platform === 'darwin') {
    execFileSync('pbcopy', [], { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
  } else if (spawnSync('which', ['wl-copy']).status === 0) {
    spawnSync('wl-copy', [], { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
  } else {
    spawnSync('xclip', ['-selection', 'clipboard'], {
      input: text,
      stdio: ['pipe', 'ignore', 'ignore'],
    });
  }
}
