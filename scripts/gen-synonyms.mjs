import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src-synonyms-temp.json'), 'utf-8'));

const header = '/** Font Awesome alias map for fuzzy search. */\nexport const SYNONYMS = ';
const footer = `;

export function expandSynonyms(slug) {
  const terms = new Set();
  const tokens = slug.replace(/-/g, ' ').split(/\\s+/);
  for (const token of tokens) {
    if (SYNONYMS[token]) for (const t of SYNONYMS[token]) terms.add(t);
  }
  const phrase = slug.replace(/-/g, ' ');
  if (SYNONYMS[phrase]) for (const t of SYNONYMS[phrase]) terms.add(t);
  return terms;
}

export function synonymTargets(query) {
  const normalised = query.toLowerCase().trim().replace(/-/g, ' ');
  const tokens = normalised.split(/\\s+/);
  const targets = new Set();
  if (SYNONYMS[normalised]) for (const t of SYNONYMS[normalised]) targets.add(t);
  for (const token of tokens) {
    if (SYNONYMS[token]) for (const t of SYNONYMS[token]) targets.add(t);
  }
  return targets;
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'synonyms.js'), header + JSON.stringify(data, null, 2) + footer);
