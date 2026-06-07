import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SYNONYMS, expandSynonyms, synonymTargets } from '../src/synonyms.js';

describe('SYNONYMS', () => {
  it('maps gear and cog to each other', () => {
    assert.ok(SYNONYMS.gear.includes('cog'));
    assert.ok(SYNONYMS.cog.includes('gear'));
  });
});

describe('expandSynonyms', () => {
  it('returns synonym targets for slug tokens', () => {
    const terms = expandSynonyms('cog');
    assert.ok(terms.has('gear'));
    assert.ok(terms.has('cogs'));
  });

  it('returns empty set for unknown slugs', () => {
    const terms = expandSynonyms('zzzz-unknown-slug');
    assert.equal(terms.size, 0);
  });

  it('expands search to magnifying glass variants', () => {
    const terms = expandSynonyms('search');
    assert.ok(terms.has('magnifying-glass'));
    assert.ok(terms.has('magnifying-glass-plus'));
  });
});

describe('synonymTargets', () => {
  it('resolves query tokens to icon slugs', () => {
    const targets = synonymTargets('gear');
    assert.ok(targets.has('cog'));
  });

  it('resolves search queries to magnifying glass slugs', () => {
    const targets = synonymTargets('search');
    assert.ok(targets.has('magnifying-glass'));
  });

  it('returns empty set for unknown queries', () => {
    const targets = synonymTargets('xyzzyplugh');
    assert.equal(targets.size, 0);
  });
});
