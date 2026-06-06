import { WRatio, partial_ratio, token_set_ratio } from 'fuzzball';
import { getCatalogue } from './index.js';
import { synonymTargets } from './synonyms.js';

export function normaliseQuery(query) {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function queryToSlug(query) {
  return normaliseQuery(query).replace(/ /g, '-');
}

function queryTokens(query) {
  return new Set(normaliseQuery(query).replace(/-/g, ' ').split(/\s+/).filter(Boolean));
}

function slugTokens(slug) {
  return new Set(slug.toLowerCase().split('-').filter(Boolean));
}

function allTokensPresent(query, slug) {
  const qt = queryTokens(query);
  const st = slugTokens(slug);
  return qt.size > 0 && [...qt].every((t) => st.has(t));
}

function isShortSlug(slug) {
  return slug.length <= 3;
}

function scoreIcon(query, slugQuery, icon) {
  const { slug, searchKeys, isLegacy } = icon;
  const qt = queryTokens(query);

  if (slugQuery === slug) {
    return { icon, score: 100, matchReason: 'exact' };
  }

  if (allTokensPresent(query, slug)) {
    const st = slugTokens(slug);
    const coverage = qt.size / st.size;
    return { icon, score: Math.min(97 + coverage * 3, 99.9), matchReason: 'all tokens' };
  }

  const targets = synonymTargets(query);
  if (targets.has(slug)) {
    return { icon, score: 93, matchReason: 'synonym' };
  }

  if (isShortSlug(slug)) {
    if (qt.size <= 1 && (qt.has(slug) || slug === slugQuery)) {
      return { icon, score: 90, matchReason: 'short exact' };
    }
    return null;
  }

  let bestScore = 0;
  let bestReason = '';

  for (const key of searchKeys) {
    if (isShortSlug(key.replace(/ /g, '-')) && qt.size > 1) continue;

    const wratio = WRatio(query, key);
    const tokenSet = token_set_ratio(query, key);
    let partial = partial_ratio(query, key);

    const lenPenalty = Math.min(slug.length, key.length) / Math.max(query.length, key.length, 1);
    if (partial > wratio && lenPenalty < 0.5) {
      partial = partial * lenPenalty * 2;
    }

    let fuzzyScore = Math.max(wratio, tokenSet, partial);
    fuzzyScore = Math.min(fuzzyScore, 92);

    if (fuzzyScore > bestScore) {
      bestScore = fuzzyScore;
      bestReason = 'fuzzy';
    }
  }

  if (slug.startsWith(slugQuery) && slugQuery.length >= 2) {
    const score = 84 + Math.min((slugQuery.length / slug.length) * 8, 8);
    if (score > bestScore) {
      bestScore = score;
      bestReason = 'prefix';
    }
  }

  if (bestScore < 55) return null;

  if (isLegacy) bestScore -= 3;

  return { icon, score: bestScore, matchReason: bestReason };
}

export function searchIcons(query, limit = 20, { noLegacy = false } = {}) {
  if (!query.trim()) return [];

  const normalised = normaliseQuery(query);
  const slugQuery = queryToSlug(query);
  const catalogue = getCatalogue();
  const results = [];

  for (const icon of catalogue) {
    if (noLegacy && icon.isLegacy) continue;
    const result = scoreIcon(normalised, slugQuery, icon);
    if (result) results.push(result);
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.icon.isLegacy !== b.icon.isLegacy) return a.icon.isLegacy ? 1 : -1;
    return a.icon.slug.localeCompare(b.icon.slug);
  });

  return results.slice(0, limit);
}

export function pickBestMatch(query, { autoGap = 15, minScore = 55, noLegacy = false } = {}) {
  const results = searchIcons(query, 10, { noLegacy });
  if (!results.length) return { best: null, results: [], needsPick: false };

  const top = results[0];
  if (top.score < minScore) return { best: null, results, needsPick: false };

  if (results.length === 1) return { best: top, results, needsPick: false };

  const second = results[1];
  const gap = top.score - second.score;
  const needsPick = gap < autoGap && second.score >= minScore;

  return { best: top, results, needsPick };
}
