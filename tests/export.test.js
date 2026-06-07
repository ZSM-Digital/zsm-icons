import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { exportIcon, prepareExport } from '../src/export.js';
import { getCatalogue } from '../src/index.js';
import { createTempDir, removeTempDir } from './helpers/temp.mjs';

let outputDir;
let savedOutputEnv;

function cogIcon() {
  return getCatalogue().find((icon) => icon.slug === 'cog');
}

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

describe('prepareExport', () => {
  it('reads and recolours an icon', () => {
    const prepared = prepareExport(cogIcon(), { colour: 'red' });
    assert.equal(prepared.icon.slug, 'cog');
    assert.match(prepared.svg, /fill="#ff0000"/);
    assert.equal(prepared.colour, '#ff0000');
    assert.ok(prepared.outputPath.endsWith('cog.svg'));
    assert.equal(prepared.overwritten, false);
  });

  it('strips attribution by default', () => {
    const prepared = prepareExport(cogIcon(), {});
    assert.doesNotMatch(prepared.svg, /<!--/);
  });

  it('keeps attribution when clean is false', () => {
    const prepared = prepareExport(cogIcon(), { clean: false });
    assert.match(prepared.svg, /<!--/);
  });

  it('builds filenames with prefix and colour suffix', () => {
    const prepared = prepareExport(cogIcon(), {
      colour: '#3b82f6',
      prefix: 'ui-',
      suffixColour: true,
    });
    assert.ok(prepared.outputPath.endsWith(path.join('ui-cog-3b82f6.svg')));
  });

  it('skips output path for stdout mode', () => {
    const prepared = prepareExport(cogIcon(), { stdout: true, colour: 'blue' });
    assert.equal(prepared.outputPath, null);
    assert.match(prepared.svg, /fill="#0000ff"/);
  });

  it('throws when icon file is missing', () => {
    const fake = { ...cogIcon(), filename: 'does-not-exist.svg' };
    assert.throws(() => prepareExport(fake, {}), /Icon not found/);
  });

  it('throws when output exists and noOverwrite is set', () => {
    const icon = cogIcon();
    const first = prepareExport(icon, { colour: 'red' });
    fs.writeFileSync(first.outputPath, first.svg, 'utf-8');
    assert.throws(
      () => prepareExport(icon, { colour: 'blue', noOverwrite: true }),
      /Output already exists/,
    );
  });
});

describe('exportIcon', () => {
  it('writes svg to the output directory', () => {
    const result = exportIcon(cogIcon(), { colour: 'green' });
    assert.ok(fs.existsSync(result.outputPath));
    const written = fs.readFileSync(result.outputPath, 'utf-8');
    assert.match(written, /fill="#008000"/);
  });

  it('does not write files during dry run', () => {
    const result = exportIcon(cogIcon(), { colour: 'red', dryRun: true });
    assert.equal(result.dryRun, true);
    assert.ok(!fs.existsSync(result.outputPath));
  });

  it('reports overwrite when replacing an existing file', () => {
    const icon = cogIcon();
    exportIcon(icon, { colour: 'red' });
    const second = exportIcon(icon, { colour: 'blue' });
    assert.equal(second.overwritten, true);
  });
});
