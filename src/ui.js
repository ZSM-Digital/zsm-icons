import boxen from 'boxen';
import chalk from 'chalk';
import { configFilePath } from './config.js';
import { getCatalogue } from './index.js';
import { iconsDir, outputDir } from './paths.js';

let bannerShown = false;

const GREY_GRADIENT = ['#f0f0f0', '#d8d8d8', '#c0c0c0', '#a8a8a8', '#909090', '#787878', '#606060'];

const theme = {
  border: 'gray',
  accent: chalk.hex('#b0b0b0'),
  bright: chalk.white,
  muted: chalk.dim,
  title: chalk.bold.hex('#d0d0d0'),
  emphasis: chalk.bold.hex('#e8e8e8'),
};

function greyGradient(text, { bold = true } = {}) {
  const chars = [...text];
  return chars
    .map((char, i) => {
      const t = chars.length > 1 ? i / (chars.length - 1) : 0;
      const shade = GREY_GRADIENT[Math.round(t * (GREY_GRADIENT.length - 1))];
      let styled = chalk.hex(shade)(char);
      if (bold) styled = chalk.bold(styled);
      return styled;
    })
    .join('');
}

export function formatMatchLabel(result) {
  const legacy = result.icon.isLegacy ? ' (legacy)' : '';
  return `${result.icon.slug}${legacy}  (${Math.round(result.score)}%)`;
}

export function showBanner({ force = false } = {}) {
  if (bannerShown && !force) return;
  bannerShown = true;

  const count = getCatalogue().length;
  const body = [
    `  ${greyGradient('ZSM Icons')}`,
    theme.muted(`  ${count.toLocaleString()}+ FontAwesome Icons`),
  ].join('\n');

  console.log(
    boxen(body, {
      padding: { top: 0, bottom: 0, left: 2, right: 2 },
      borderColor: theme.border,
      borderStyle: 'round',
    }),
  );
  console.log();
}

export function showSuccess(result) {
  const lines = [
    chalk.bold.white(`  ${result.icon.filename}`) +
      chalk.dim(`          match: ${Math.round(result.score)}%`),
  ];

  if (result.colour) {
    lines.push(
      chalk.dim('  colour: ') +
        chalk.hex(result.colour === 'none' ? '#888' : result.colour)(` ${result.colour}`),
    );
  }

  if (result.stdout) {
    lines.push(theme.muted('  (written to stdout)'));
  } else if (result.outputPath) {
    lines.push(theme.emphasis('  -> ') + theme.bright(result.outputPath));
  }

  if (result.overwritten) {
    lines.push(theme.muted.italic('  (overwritten existing file)'));
  }

  console.log(
    boxen(lines.join('\n'), {
      title: result.dryRun ? theme.title('Dry run') : theme.title('Exported'),
      titleAlignment: 'left',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderColor: theme.border,
      borderStyle: 'round',
    }),
  );
}

export function showDryRun(prepared) {
  showSuccess({ ...prepared, dryRun: true });
}

export function showLowConfidenceWarning(selected, gap) {
  const score = Math.round(selected.score);
  const gapNote = gap != null ? ` (gap: ${Math.round(gap)}%)` : '';
  console.log(
    chalk.dim(
      `  Auto-selected '${selected.icon.slug}' at ${score}%${gapNote} — run without -y to choose manually.`,
    ),
  );
}

export function showMatchTable(results, title = 'Matches') {
  if (!results.length) {
    console.log(chalk.dim('No matches found.'));
    return;
  }

  const header = theme.emphasis(`  ${title}`);
  console.log(header);
  console.log(chalk.dim('  ' + '-'.repeat(56)));

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(chalk.dim(`  ${String(i + 1).padStart(2)}.`) + ` ${formatMatchLabel(r)}`);
  }
  console.log();
}

export function showNoMatch(query, suggestions = []) {
  console.log(
    boxen(theme.muted('No icon found for ') + theme.bright(`'${query}'`), {
      borderColor: theme.border,
      borderStyle: 'round',
    }),
  );
  if (suggestions.length) {
    console.log(chalk.dim('\nDid you mean:'));
    showMatchTable(suggestions.slice(0, 3), 'Suggestions');
  }
}

export function showError(message) {
  console.log(boxen(theme.bright(message), { borderColor: theme.border, borderStyle: 'round' }));
}

export function showIconList(filterText = null, limit = 50) {
  let icons = getCatalogue();

  if (filterText) {
    const needle = filterText.toLowerCase().replace(/ /g, '-');
    icons = icons.filter((i) => i.slug.includes(needle));
  }

  const total = icons.length;
  const display = icons.slice(0, limit);

  const title = filterText
    ? theme.emphasis(`Icons matching `) +
      theme.bright(filterText) +
      theme.muted(` (${total.toLocaleString()} total)`)
    : theme.emphasis(`Icons`) + theme.muted(` (${total.toLocaleString()} total)`);

  console.log(`  ${title}\n`);

  for (let i = 0; i < display.length; i++) {
    const icon = display[i];
    const legacy = icon.isLegacy ? chalk.dim(' (legacy)') : '';
    console.log(chalk.dim(`  ${String(i + 1).padStart(4)}.`) + ` ${icon.slug}${legacy}`);
  }

  if (total > limit) {
    console.log(chalk.dim(`\n  Showing ${limit} of ${total.toLocaleString()}. Use a narrower filter.`));
  }
  console.log();
}

export function formatJsonExport(result) {
  return {
    matched: result.icon.slug,
    filename: result.icon.filename,
    score: Math.round(result.score * 10) / 10,
    source: result.sourcePath,
    output: result.outputPath,
    colour: result.colour,
    overwritten: result.overwritten,
    dryRun: result.dryRun ?? false,
    stdout: result.stdout ?? false,
  };
}

export function formatJsonSearchResults(query, results) {
  return {
    query,
    count: results.length,
    results: results.map((r) => ({
      slug: r.icon.slug,
      filename: r.icon.filename,
      score: Math.round(r.score * 10) / 10,
      matchReason: r.matchReason,
      legacy: r.icon.isLegacy,
    })),
  };
}

export function formatJsonIconList(filterText, icons, total) {
  return {
    filter: filterText,
    count: icons.length,
    total,
    icons: icons.map((i) => ({
      slug: i.slug,
      filename: i.filename,
      legacy: i.isLegacy,
    })),
  };
}

export function showIconInfo(icon, { verbose = false } = {}) {
  const lines = [
    chalk.dim('  slug:     ') + chalk.white(icon.slug),
    chalk.dim('  file:     ') + chalk.white(icon.filename),
    chalk.dim('  legacy:   ') + chalk.white(icon.isLegacy ? 'yes' : 'no'),
    chalk.dim('  source:   ') + chalk.white(icon.path),
  ];

  if (verbose) {
    lines.push(chalk.dim('  keys:     ') + chalk.white(icon.searchKeys.join(', ')));
  }

  console.log(
    boxen(lines.join('\n'), {
      title: theme.title('Icon info'),
      titleAlignment: 'left',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderColor: theme.border,
      borderStyle: 'round',
    }),
  );
}

export function showPaths() {
  const lines = [
    chalk.dim('  icons:   ') + chalk.white(iconsDir()),
    chalk.dim('  output:  ') + chalk.white(outputDir()),
    chalk.dim('  config:  ') + chalk.white(configFilePath()),
  ];
  console.log(
    boxen(lines.join('\n'), {
      title: theme.title('Paths'),
      titleAlignment: 'left',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderColor: theme.border,
      borderStyle: 'round',
    }),
  );
}

export function showRecentList(entries) {
  if (!entries.length) {
    console.log(chalk.dim('  No recent exports.'));
    return;
  }

  console.log(theme.emphasis('  Recent exports\n'));
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const colour = e.colour ? chalk.dim(` · ${e.colour}`) : '';
    console.log(
      chalk.dim(`  ${String(i + 1).padStart(2)}.`) +
        ` ${e.slug}${colour}` +
        chalk.dim(`  ${e.outputPath}`),
    );
  }
  console.log();
}

export function showBatchSummary(results) {
  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  console.log(theme.emphasis(`\n  Batch complete: ${ok.length} exported, ${failed.length} failed\n`));

  for (const r of ok) {
    console.log(theme.accent('  ✓ ') + `${r.query} → ${r.result.icon.slug}`);
  }
  for (const r of failed) {
    console.log(theme.muted('  ✗ ') + `${r.query}: ${r.error}`);
  }
  console.log();
}

export async function showEmptyStateLanding() {
  console.log(chalk.dim('  Try: ') + chalk.white('zsm cog -c blue'));
  console.log(chalk.dim('  Or run ') + chalk.white('zsm help') + chalk.dim(' for all commands.\n'));
}

export function showHelp() {
  showBanner();
  console.log(chalk.bold('Commands\n'));
  console.log(`  ${theme.accent('zsm')} ${theme.bright('<icon>')} ${theme.muted('[options]')}     Fuzzy find and export`);
  console.log(`  ${theme.accent('zsm search')} ${theme.bright('<query>')}           Search without exporting`);
  console.log(`  ${theme.accent('zsm list')} ${theme.bright('[filter]')}            Browse available icons`);
  console.log(`  ${theme.accent('zsm info')} ${theme.bright('<slug>')}              Show icon metadata`);
  console.log(`  ${theme.accent('zsm path')}                            Show resolved paths`);
  console.log(`  ${theme.accent('zsm recent')} ${theme.bright('[n]')}                List or re-export recent`);
  console.log(`  ${theme.accent('zsm batch')} ${theme.bright('<icons...>')}          Export multiple icons`);
  console.log(`  ${theme.accent('zsm i')}                                 Interactive mode`);
  console.log(`  ${theme.accent('zsm completion')} ${theme.bright('<shell>')}        Shell completions (bash/zsh/fish)\n`);
  console.log(chalk.bold('Options\n'));
  console.log(`  ${theme.accent('-c, --color')} ${theme.bright('COLOUR')}    Recolour the SVG fill`);
  console.log(`  ${theme.accent('-o, --output')} ${theme.bright('FILE')}     Custom output filename (- for stdout)`);
  console.log(`  ${theme.accent('--stdout')}                           Write SVG to stdout`);
  console.log(`  ${theme.accent('--dry-run')}                          Preview without writing`);
  console.log(`  ${theme.accent('-y, --yes')}                     Skip disambiguation picker`);
  console.log(`  ${theme.accent('--no-legacy')}                       Exclude legacy (-alt) icons`);
  console.log(`  ${theme.accent('--reveal')}                           Reveal in file manager`);
  console.log(`  ${theme.accent('--copy-path')}                        Copy output path to clipboard`);
  console.log(`  ${theme.accent('--json')}                               Output as JSON`);
  console.log(`  ${theme.accent('-q, --quiet')}                   Suppress banner\n`);
  console.log(chalk.dim(`Output folder: ${outputDir()}`));
  console.log(chalk.dim(`Config file:   ${configFilePath()}`));
  console.log(chalk.dim(`Set ZSM_OUTPUT_DIR to override output location.\n`));
  console.log(chalk.bold('Exit codes\n'));
  console.log(`  ${chalk.dim('0')}  success`);
  console.log(`  ${chalk.dim('1')}  no match / user-facing error`);
  console.log(`  ${chalk.dim('2')}  invalid arguments\n`);
  console.log(chalk.bold('Examples\n'));
  console.log(chalk.dim('  $') + ' zsm left arrow -c red');
  console.log(chalk.dim('  $') + ' zsm cog --color "#3b82f6" --reveal');
  console.log(chalk.dim('  $') + ' zsm serch -y');
  console.log(chalk.dim('  $') + ' zsm cog -c red --stdout > ./assets/cog.svg');
  console.log();
}
