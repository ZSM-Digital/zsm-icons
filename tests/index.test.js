import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCatalogue, getCatalogue } from '../src/index.js';

describe('buildCatalogue', () => {
  it('loads svg icons from the icons directory', () => {
    const catalogue = buildCatalogue();
    assert.ok(catalogue.length > 0);
    assert.ok(catalogue.every((icon) => icon.filename.endsWith('.svg')));
    assert.ok(catalogue.every((icon) => icon.slug.length > 0));
    assert.ok(catalogue.every((icon) => icon.searchKeys.length > 0));
  });

  it('marks legacy icons ending in -alt', () => {
    const catalogue = buildCatalogue();
    const legacy = catalogue.filter((icon) => icon.isLegacy);
    const nonLegacy = catalogue.filter((icon) => !icon.isLegacy);
    assert.ok(legacy.length > 0);
    assert.ok(nonLegacy.length > 0);
    assert.ok(legacy.every((icon) => icon.slug.endsWith('-alt')));
    assert.ok(nonLegacy.every((icon) => !icon.slug.endsWith('-alt')));
  });

  it('includes cog in the catalogue', () => {
    const cog = buildCatalogue().find((icon) => icon.slug === 'cog');
    assert.ok(cog);
    assert.equal(cog.filename, 'cog.svg');
    assert.ok(cog.searchKeys.includes('cog'));
  });
});

describe('getCatalogue', () => {
  it('returns the same catalogue instance', () => {
    assert.equal(getCatalogue(), buildCatalogue());
  });
});
