import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Command } from 'commander';
import { generateCompletion } from '../src/completion.js';

function mockProgram() {
  const program = new Command();
  program.command('search');
  program.command('list');
  program.command('info');
  program.command('batch');
  return program;
}

describe('generateCompletion', () => {
  it('generates bash completion', () => {
    const script = generateCompletion('bash', mockProgram());
    assert.match(script, /complete -F _zsm_completions zsm/);
    assert.match(script, /search/);
    assert.match(script, /list/);
  });

  it('generates zsh completion', () => {
    const script = generateCompletion('zsh', mockProgram());
    assert.match(script, /#compdef zsm/);
    assert.match(script, /search:Search icons without exporting/);
  });

  it('generates fish completion', () => {
    const script = generateCompletion('fish', mockProgram());
    assert.match(script, /complete -c zsm -f/);
    assert.match(script, /__fish_seen_subcommand_from completion/);
  });

  it('rejects unsupported shells', () => {
    assert.throws(
      () => generateCompletion('powershell', mockProgram()),
      /Unsupported shell/,
    );
  });
});
