import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ColourError,
  applyColour,
  resolveColour,
  stripComment,
} from '../src/colorize.js';

const SAMPLE_SVG =
  '<svg><!-- Font Awesome attribution --><path fill="#ffffff" d="M0 0"/></svg>';

describe('resolveColour', () => {
  it('resolves named colours', () => {
    assert.equal(resolveColour('red'), '#ff0000');
    assert.equal(resolveColour('  Blue '), '#0000ff');
    assert.equal(resolveColour('sky-blue'), '#87ceeb');
  });

  it('resolves hex values', () => {
    assert.equal(resolveColour('#ff5500'), '#ff5500');
    assert.equal(resolveColour('abc'), '#aabbcc');
    assert.equal(resolveColour('#aabbccdd'), '#aabbccdd');
  });

  it('resolves special values', () => {
    assert.equal(resolveColour('currentColor'), 'currentColor');
    assert.equal(resolveColour('CURRENTCOLOR'), 'currentColor');
    assert.equal(resolveColour('none'), 'none');
    assert.equal(resolveColour('transparent'), 'none');
  });

  it('rejects invalid values', () => {
    assert.throws(() => resolveColour(''), ColourError);
    assert.throws(() => resolveColour('   '), ColourError);
    assert.throws(() => resolveColour('not-a-colour'), ColourError);
    assert.throws(() => resolveColour('#gggggg'), ColourError);
  });
});

describe('applyColour', () => {
  it('returns unchanged svg when colour is omitted', () => {
    const result = applyColour(SAMPLE_SVG, null);
    assert.equal(result.svg, SAMPLE_SVG);
    assert.equal(result.resolved, null);
  });

  it('replaces fill with resolved colour', () => {
    const { svg, resolved } = applyColour(SAMPLE_SVG, 'red');
    assert.equal(resolved, '#ff0000');
    assert.match(svg, /fill="#ff0000"/);
    assert.doesNotMatch(svg, /fill="#ffffff"/);
  });

  it('sets fill to none for transparent colours', () => {
    const { svg, resolved } = applyColour(SAMPLE_SVG, 'transparent');
    assert.equal(resolved, 'none');
    assert.match(svg, /fill="none"/);
  });
});

describe('stripComment', () => {
  it('removes html comments from svg', () => {
    const stripped = stripComment(SAMPLE_SVG);
    assert.doesNotMatch(stripped, /<!--/);
    assert.match(stripped, /<path fill="#ffffff"/);
  });
});
