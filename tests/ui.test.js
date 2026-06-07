import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getCatalogue } from '../src/index.js';
import {
  formatJsonExport,
  formatJsonIconList,
  formatJsonSearchResults,
  formatMatchLabel,
} from '../src/ui.js';
import { searchIcons } from '../src/search.js';

describe('formatMatchLabel', () => {
  it('includes slug, score, and legacy marker', () => {
    const cog = searchIcons('cog', 1)[0];
    assert.match(formatMatchLabel(cog), /^cog\s+\(100%\)$/);

    const legacy = getCatalogue().find((icon) => icon.isLegacy);
    const legacyResult = {
      icon: legacy,
      score: 88.4,
      matchReason: 'fuzzy',
    };
    assert.match(formatMatchLabel(legacyResult), /\(legacy\)/);
    assert.match(formatMatchLabel(legacyResult), /88%/);
  });
});

describe('formatJsonExport', () => {
  it('serialises export metadata', () => {
    const cog = getCatalogue().find((icon) => icon.slug === 'cog');
    const payload = formatJsonExport({
      icon: cog,
      sourcePath: cog.path,
      outputPath: '/tmp/cog.svg',
      colour: '#ff0000',
      overwritten: false,
      score: 99.44,
      stdout: false,
    });
    assert.equal(payload.matched, 'cog');
    assert.equal(payload.filename, 'cog.svg');
    assert.equal(payload.score, 99.4);
    assert.equal(payload.colour, '#ff0000');
    assert.equal(payload.dryRun, false);
  });
});

describe('formatJsonSearchResults', () => {
  it('serialises search hits', () => {
    const results = searchIcons('cog', 2);
    const payload = formatJsonSearchResults('cog', results);
    assert.equal(payload.query, 'cog');
    assert.equal(payload.count, results.length);
    assert.equal(payload.results[0].slug, 'cog');
    assert.equal(payload.results[0].matchReason, 'exact');
    assert.equal(payload.results[0].legacy, false);
  });
});

describe('formatJsonIconList', () => {
  it('serialises icon list metadata', () => {
    const icons = getCatalogue().slice(0, 3);
    const payload = formatJsonIconList('co', icons, 42);
    assert.equal(payload.filter, 'co');
    assert.equal(payload.count, 3);
    assert.equal(payload.total, 42);
    assert.equal(payload.icons.length, 3);
    assert.ok(payload.icons.every((icon) => 'legacy' in icon));
  });
});
