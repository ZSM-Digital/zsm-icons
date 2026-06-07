import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  createTempDir,
  isolateUserDataDir,
  removeTempDir,
} from './helpers/temp.mjs';

let tempDir;
let restoreEnv;
let recent;

beforeEach(async () => {
  tempDir = createTempDir();
  restoreEnv = isolateUserDataDir(tempDir);
  recent = await import(`../src/recent.js?cacheBust=${Date.now()}`);
});

afterEach(() => {
  restoreEnv();
  removeTempDir(tempDir);
});

describe('recent exports', () => {
  it('starts with an empty list', () => {
    assert.deepEqual(recent.getRecentExports(), []);
  });

  it('records exports at the front of the list', () => {
    recent.addRecentExport({
      slug: 'cog',
      colour: '#ff0000',
      outputPath: '/tmp/cog.svg',
      score: 100,
    });
    recent.addRecentExport({
      slug: 'star',
      colour: null,
      outputPath: '/tmp/star.svg',
      score: 95,
    });
    const entries = recent.getRecentExports();
    assert.equal(entries.length, 2);
    assert.equal(entries[0].slug, 'star');
    assert.equal(entries[1].slug, 'cog');
  });

  it('deduplicates by output path', () => {
    recent.addRecentExport({
      slug: 'cog',
      colour: 'red',
      outputPath: '/tmp/cog.svg',
      score: 80,
    });
    recent.addRecentExport({
      slug: 'cog',
      colour: 'blue',
      outputPath: '/tmp/cog.svg',
      score: 100,
    });
    const entries = recent.getRecentExports();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].colour, 'blue');
    assert.equal(entries[0].score, 100);
  });

  it('retrieves entries by one-based index', () => {
    recent.addRecentExport({
      slug: 'heart',
      colour: null,
      outputPath: '/tmp/heart.svg',
      score: 90,
    });
    assert.equal(recent.getRecentExport(1).slug, 'heart');
    assert.equal(recent.getRecentExport(2), null);
    assert.equal(recent.getRecentExport(0), null);
  });

  it('caps the list at ten entries', () => {
    for (let i = 0; i < 12; i++) {
      recent.addRecentExport({
        slug: `icon-${i}`,
        colour: null,
        outputPath: `/tmp/icon-${i}.svg`,
        score: i,
      });
    }
    const entries = recent.getRecentExports();
    assert.equal(entries.length, 10);
    assert.equal(entries[0].slug, 'icon-11');
    assert.equal(entries[9].slug, 'icon-2');
  });
});
