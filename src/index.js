import fs from 'fs';
import path from 'path';
import { iconsDir } from './paths.js';
import { expandSynonyms } from './synonyms.js';

/** @typedef {{ slug: string, filename: string, path: string, searchKeys: string[], isLegacy: boolean }} IconEntry */

/** @type {IconEntry[] | null} */
let catalogue = null;

function tokenise(slug) {
  return slug.toLowerCase().split('-').filter(Boolean);
}

function buildSearchKeys(slug) {
  const keys = new Set();
  const tokens = tokenise(slug);

  keys.add(slug.toLowerCase());
  keys.add(tokens.join(' '));

  if (tokens.length >= 2) {
    keys.add([...tokens].reverse().join(' '));
  }

  for (const synonym of expandSynonyms(slug)) {
    keys.add(synonym.toLowerCase());
    keys.add(synonym.toLowerCase().replace(/-/g, ' '));
  }

  return [...keys].sort();
}

export function buildCatalogue() {
  if (catalogue) return catalogue;

  const iconsPath = iconsDir();
  if (!fs.existsSync(iconsPath)) {
    throw new Error(`Icons directory not found: ${iconsPath}`);
  }

  const files = fs.readdirSync(iconsPath).filter((f) => f.endsWith('.svg')).sort();

  catalogue = files.map((filename) => {
    const slug = path.basename(filename, '.svg');
    return {
      slug,
      filename,
      path: path.join(iconsPath, filename),
      searchKeys: buildSearchKeys(slug),
      isLegacy: slug.endsWith('-alt'),
    };
  });

  return catalogue;
}

export function getCatalogue() {
  return buildCatalogue();
}
