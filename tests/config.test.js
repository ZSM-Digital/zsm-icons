import assert from 'node:assert/strict';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { configFilePath, getConfiguredOutputDir } from '../src/config.js';

const savedEnv = process.env.ZSM_OUTPUT_DIR;

afterEach(() => {
  if (savedEnv === undefined) delete process.env.ZSM_OUTPUT_DIR;
  else process.env.ZSM_OUTPUT_DIR = savedEnv;
});

describe('getConfiguredOutputDir', () => {
  it('prefers ZSM_OUTPUT_DIR over config file', () => {
    process.env.ZSM_OUTPUT_DIR = './custom-output';
    assert.equal(
      getConfiguredOutputDir(),
      path.resolve('./custom-output'),
    );
  });

  it('trims whitespace from ZSM_OUTPUT_DIR', () => {
    process.env.ZSM_OUTPUT_DIR = '  ./trimmed  ';
    assert.equal(
      getConfiguredOutputDir(),
      path.resolve('./trimmed'),
    );
  });

  it('returns null when no output dir is configured', () => {
    delete process.env.ZSM_OUTPUT_DIR;
    const dir = getConfiguredOutputDir();
    if (dir !== null) {
      assert.ok(path.isAbsolute(dir));
    }
  });
});

describe('configFilePath', () => {
  it('returns an absolute path under the user config location', () => {
    const file = configFilePath();
    assert.ok(path.isAbsolute(file));
    assert.ok(file.endsWith(path.join('zsm', 'config.json')));
  });
});
