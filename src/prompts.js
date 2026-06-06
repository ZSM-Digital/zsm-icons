import readline from 'readline';
import { select, input, confirm } from '@inquirer/prompts';

export function isExitError(err) {
  return err?.name === 'ExitPromptError' || err?.name === 'AbortPromptError';
}

async function withEscapeAbort(run) {
  if (!process.stdin.isTTY) {
    return run(undefined);
  }

  const controller = new AbortController();
  readline.emitKeypressEvents(process.stdin);

  const onKeypress = (_str, key) => {
    if (key?.name === 'escape') {
      controller.abort();
    }
  };

  process.stdin.on('keypress', onKeypress);
  try {
    return await run(controller.signal);
  } finally {
    process.stdin.removeListener('keypress', onKeypress);
  }
}

export function promptSelect(config) {
  return withEscapeAbort((signal) => select(config, { signal }));
}

export function promptInput(config) {
  return withEscapeAbort((signal) => input(config, { signal }));
}

export function promptConfirm(config) {
  return withEscapeAbort((signal) => confirm(config, { signal }));
}
