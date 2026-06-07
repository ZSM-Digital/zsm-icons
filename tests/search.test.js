import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normaliseQuery,
  pickBestMatch,
  queryToSlug,
  searchIcons,
} from '../src/search.js';

describe('normaliseQuery', () => {
  it('lowercases, trims, and collapses whitespace', () => {
    assert.equal(normaliseQuery('  Left   Arrow  '), 'left arrow');
    assert.equal(normaliseQuery('COG'), 'cog');
  });
});

describe('queryToSlug', () => {
  it('converts spaced queries to slug form', () => {
    assert.equal(queryToSlug('left arrow'), 'left-arrow');
    assert.equal(queryToSlug('  cog '), 'cog');
  });
});

describe('searchIcons', () => {
  it('returns empty array for blank queries', () => {
    assert.deepEqual(searchIcons(''), []);
    assert.deepEqual(searchIcons('   '), []);
  });

  it('finds exact slug matches at the top', () => {
    const results = searchIcons('cog', 5);
    assert.ok(results.length > 0);
    assert.equal(results[0].icon.slug, 'cog');
    assert.equal(results[0].matchReason, 'exact');
    assert.equal(results[0].score, 100);
  });

  it('matches synonyms', () => {
    const results = searchIcons('gear', 10);
    const slugs = results.map((r) => r.icon.slug);
    assert.ok(slugs.includes('cog'));
    const cog = results.find((r) => r.icon.slug === 'cog');
    assert.equal(cog.matchReason, 'synonym');
  });

  it('tolerates typos via fuzzy matching', () => {
    const results = searchIcons('serch', 5);
    assert.ok(results.length > 0);
    const slugs = results.map((r) => r.icon.slug);
    assert.ok(
      slugs.some((s) => s.includes('search') || s.includes('magnifying')),
    );
  });

  it('excludes legacy icons when noLegacy is set', () => {
    const withLegacy = searchIcons('home', 20);
    const withoutLegacy = searchIcons('home', 20, { noLegacy: true });
    assert.ok(withLegacy.some((r) => r.icon.isLegacy));
    assert.ok(!withoutLegacy.some((r) => r.icon.isLegacy));
  });

  it('respects the result limit', () => {
    const results = searchIcons('arrow', 3);
    assert.equal(results.length, 3);
  });

  it('sorts by score descending then slug', () => {
    const results = searchIcons('arrow', 10);
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i - 1].score >= results[i].score);
    }
  });
});

describe('pickBestMatch', () => {
  it('returns null best for no matches', () => {
    const pick = pickBestMatch('.');
    assert.equal(pick.best, null);
    assert.equal(pick.results.length, 0);
    assert.equal(pick.needsPick, false);
  });

  it('returns the top match for exact queries', () => {
    const pick = pickBestMatch('cog');
    assert.equal(pick.best.icon.slug, 'cog');
    assert.equal(pick.best.score, 100);
  });

  it('flags ambiguous matches when scores are close', () => {
    const pick = pickBestMatch('arrow', { autoGap: 100 });
    assert.ok(pick.results.length >= 2);
    assert.equal(pick.needsPick, true);
  });
});
