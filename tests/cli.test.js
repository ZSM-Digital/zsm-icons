import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { runCli } from './helpers/run-cli.mjs';
import { createTempDir, removeTempDir } from './helpers/temp.mjs';

let outputDir;
let savedOutputEnv;

beforeEach(() => {
  outputDir = createTempDir();
  savedOutputEnv = process.env.ZSM_OUTPUT_DIR;
  process.env.ZSM_OUTPUT_DIR = outputDir;
});

afterEach(() => {
  if (savedOutputEnv === undefined) delete process.env.ZSM_OUTPUT_DIR;
  else process.env.ZSM_OUTPUT_DIR = savedOutputEnv;
  removeTempDir(outputDir);
});

function cliEnv() {
  return { ZSM_OUTPUT_DIR: outputDir, NO_COLOR: '1', FORCE_COLOR: '0' };
}

describe('cli', () => {
  it('prints version', () => {
    const { status, stdout } = runCli(['-V'], cliEnv());
    assert.equal(status, 0);
    assert.match(stdout.trim(), /^1\.0\.0$/);
  });

  it('searches icons as json', () => {
    const { status, stdout } = runCli(
      ['search', 'cog', '-n', '3', '--json', '-q'],
      cliEnv(),
    );
    assert.equal(status, 0);
    const data = JSON.parse(stdout);
    assert.equal(data.query, 'cog');
    assert.ok(data.count >= 1);
    assert.equal(data.results[0].slug, 'cog');
  });

  it('exits with error when search finds nothing', () => {
    const { status } = runCli(['search', '.', '--json', '-q'], cliEnv());
    assert.equal(status, 1);
  });

  it('rejects search without a query', () => {
    const { status, stderr } = runCli(['search', '-q'], cliEnv());
    assert.equal(status, 1);
    assert.match(stderr, /required argument/i);
  });

  it('lists icons with filter as json', () => {
    const { status, stdout } = runCli(
      ['list', 'cog', '-n', '5', '--json', '-q'],
      cliEnv(),
    );
    assert.equal(status, 0);
    const data = JSON.parse(stdout);
    assert.equal(data.filter, 'cog');
    assert.ok(data.icons.some((icon) => icon.slug === 'cog'));
  });

  it('shows icon info as json', () => {
    const { status, stdout } = runCli(['info', 'cog', '--json', '-q'], cliEnv());
    assert.equal(status, 0);
    const data = JSON.parse(stdout);
    assert.equal(data.slug, 'cog');
    assert.equal(data.filename, 'cog.svg');
  });

  it('exits with error for unknown icon info', () => {
    const { status } = runCli(
      ['info', 'zzzznonexistenticon12345', '-q'],
      cliEnv(),
    );
    assert.equal(status, 1);
  });

  it('exports icon with dry run', () => {
    const { status, stdout } = runCli(
      ['cog', '-y', '-c', 'red', '--dry-run', '-q'],
      cliEnv(),
    );
    assert.equal(status, 0);
    assert.match(stdout, /cog\.svg/);
    assert.equal(fs.readdirSync(outputDir).length, 0);
  });

  it('exports icon to stdout', () => {
    const { status, stdout } = runCli(
      ['cog', '-y', '-c', 'blue', '--stdout', '-q'],
      cliEnv(),
    );
    assert.equal(status, 0);
    assert.match(stdout, /<svg/);
    assert.match(stdout, /fill="#0000ff"/);
    assert.equal(fs.readdirSync(outputDir).length, 0);
  });

  it('exports icon to the configured output directory', () => {
    const { status, stdout } = runCli(
      ['cog', '-y', '-c', 'red', '--json', '-q'],
      cliEnv(),
    );
    assert.equal(status, 0);
    const data = JSON.parse(stdout);
    assert.ok(fs.existsSync(data.output));
    const svg = fs.readFileSync(data.output, 'utf-8');
    assert.match(svg, /fill="#ff0000"/);
    assert.equal(path.dirname(data.output), path.resolve(outputDir));
  });

  it('rejects invalid colour values', () => {
    const { status, stdout } = runCli(
      ['cog', '-y', '-c', 'not-a-colour', '-q'],
      cliEnv(),
    );
    assert.equal(status, 1);
    assert.match(stdout, /Invalid colour/i);
  });

  it('batch export requires -y', () => {
    const { status, stdout } = runCli(['batch', 'cog', 'star', '-q'], cliEnv());
    assert.equal(status, 2);
    assert.match(stdout, /requires -y/i);
  });

  it('batch exports multiple icons', () => {
    const { status, stdout } = runCli(
      ['batch', 'cog', 'star', '-y', '-c', 'white', '--json', '-q'],
      cliEnv(),
    );
    assert.equal(status, 0);
    const data = JSON.parse(stdout);
    assert.equal(data.exported, 2);
    assert.equal(data.failed, 0);
    assert.equal(data.results.length, 2);
  });

  it('generates bash completion', () => {
    const { status, stdout } = runCli(['completion', 'bash'], cliEnv());
    assert.equal(status, 0);
    assert.match(stdout, /complete -F _zsm_completions zsm/);
  });

  it('rejects invalid completion shell', () => {
    const { status } = runCli(['completion', 'powershell'], cliEnv());
    assert.equal(status, 2);
  });

  it('shows resolved paths', () => {
    const { status, stdout } = runCli(['path', '-q'], cliEnv());
    assert.equal(status, 0);
    assert.match(stdout, /icons/i);
    assert.match(stdout, /output/i);
  });
});
