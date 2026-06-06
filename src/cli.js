import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { isExitError, promptConfirm, promptInput, promptSelect } from './prompts.js';
import { Command } from 'commander';
import ora from 'ora';
import { ColourError, resolveColour } from './colorize.js';
import { generateCompletion } from './completion.js';
import { configFilePath } from './config.js';
import { exportIcon } from './export.js';
import { EXIT_ERROR, EXIT_INVALID } from './exitCodes.js';
import { buildCatalogue, getCatalogue } from './index.js';
import { iconsDir, outputDir } from './paths.js';
import { copyToClipboard, openFile, revealInFileManager } from './platform.js';
import { addRecentExport, getRecentExport, getRecentExports } from './recent.js';
import { pickBestMatch, searchIcons } from './search.js';
import {
  formatJsonExport,
  formatJsonIconList,
  formatJsonSearchResults,
  showBanner,
  showBatchSummary,
  showEmptyStateLanding,
  showError,
  showHelp,
  showIconInfo,
  showIconList,
  showLowConfidenceWarning,
  formatMatchLabel,
  showMatchTable,
  showNoMatch,
  showPaths,
  showRecentList,
  showSuccess,
} from './ui.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));

let catalogueReady = false;

const LOW_CONFIDENCE_THRESHOLD = 80;

function ensureCatalogue({ quiet = false } = {}) {
  if (catalogueReady) return;
  const spinner = quiet ? null : ora({ text: 'Loading icon catalogue…', color: 'gray' }).start();
  buildCatalogue();
  if (spinner) spinner.stop();
  catalogueReady = true;
}

async function pickIcon(results) {
  if (!results.length) return null;

  return promptSelect({
    message: 'Multiple matches — pick one:',
    choices: results.slice(0, 8).map((r) => ({
      name: formatMatchLabel(r),
      value: r,
    })),
  });
}

function applyPostExportActions(result, { open = false, reveal = false, copyPath = false, quiet = false }) {
  if (!result.outputPath) return;
  if (reveal) revealInFileManager(result.outputPath);
  if (open) openFile(result.outputPath);
  if (copyPath) {
    copyToClipboard(result.outputPath);
    if (!quiet) console.log('\x1b[2m  Path copied to clipboard.\x1b[0m');
  }
}

function recordRecent(result) {
  if (!result.outputPath || result.dryRun || result.stdout) return;
  addRecentExport({
    slug: result.icon.slug,
    colour: result.colour,
    outputPath: result.outputPath,
    score: result.score,
  });
}

async function resolveAndExport(query, options = {}) {
  const {
    colour = null,
    outputName = null,
    yes = false,
    clean = true,
    noOverwrite = false,
    asJson = false,
    quiet = false,
    noLegacy = false,
    dryRun = false,
    stdout = false,
    open = false,
    reveal = false,
    copyPath = false,
    suffixColour = false,
    prefix = null,
  } = options;

  ensureCatalogue({ quiet: quiet || asJson || stdout });

  const { best, results, needsPick } = pickBestMatch(query, { noLegacy });

  if (!best) {
    if (asJson) {
      console.log(JSON.stringify({ error: 'no match', query }));
    } else {
      showNoMatch(query, searchIcons(query, 3, { noLegacy }));
    }
    process.exit(EXIT_ERROR);
  }

  let selected = best;

  if (needsPick && yes) {
    const gap = results.length > 1 ? results[0].score - results[1].score : null;
    if (!asJson && !quiet && !stdout && (selected.score < LOW_CONFIDENCE_THRESHOLD || gap < 15)) {
      showLowConfidenceWarning(selected, gap);
    }
  }

  if (needsPick && !yes) {
    if (!asJson && !stdout) {
      showMatchTable(results.slice(0, 8), `Matches for '${query}'`);
    }
    try {
      const picked = await pickIcon(results);
      if (!picked) process.exit(EXIT_ERROR);
      selected = picked;
    } catch (err) {
      if (isExitError(err)) {
        if (!asJson && !quiet && !stdout) console.log('\n\x1b[2mGoodbye!\x1b[0m');
        process.exit(0);
      }
      throw err;
    }
  }

  const useStdout = stdout || outputName === '-';

  try {
    const result = exportIcon(selected.icon, {
      colour,
      outputName: useStdout ? null : outputName,
      clean,
      noOverwrite,
      score: selected.score,
      dryRun,
      stdout: useStdout,
      suffixColour,
      prefix,
    });

    if (!dryRun && !useStdout) {
      recordRecent(result);
    }

    if (asJson) {
      const json = JSON.stringify(formatJsonExport(result), null, 2);
      if (useStdout) {
        console.error(json);
      } else {
        console.log(json);
      }
    } else if (!useStdout) {
      showSuccess(result);
    }

    if (!dryRun) {
      applyPostExportActions(result, { open, reveal, copyPath, quiet: quiet || useStdout });
    }

    return result;
  } catch (err) {
    if (err instanceof ColourError || err.message?.includes('already exists')) {
      if (asJson) {
        console.log(JSON.stringify({ error: err.message }));
      } else {
        showError(err.message);
      }
      process.exit(EXIT_ERROR);
    }
    throw err;
  }
}

async function runInteractive({ quiet = false } = {}) {
  ensureCatalogue();
  if (!quiet) showBanner({ force: true });

  console.log('\x1b[2mInteractive mode — Esc or Ctrl+C to exit\x1b[0m\n');

  let lastColour = null;

  while (true) {
    try {
      const query = await promptInput({
        message: 'Icon name:',
        validate: (v) => (v.trim() ? true : 'Enter an icon name.'),
      });

      if (!query.trim()) continue;

      const results = searchIcons(query.trim(), 8);
      if (!results.length) {
        showNoMatch(query.trim(), searchIcons(query.trim(), 3));
        continue;
      }

      let selected;
      const { needsPick } = pickBestMatch(query.trim());

      if (needsPick) {
        showMatchTable(results.slice(0, 8), `Matches for '${query.trim()}'`);
        selected = await pickIcon(results);
        if (!selected) continue;
      } else {
        selected = results[0];
        console.log(
          `  \x1b[2m->\x1b[0m ${selected.icon.slug} \x1b[2m(${Math.round(selected.score)}%)\x1b[0m`,
        );
      }

      console.log('\x1b[2m  hex, named (red), currentColor, none\x1b[0m');
      const colourInput = await promptInput({
        message: 'Colour (optional, Enter to keep white):',
        default: lastColour ?? '',
        validate: (v) => {
          if (!v.trim()) return true;
          try {
            resolveColour(v);
            return true;
          } catch (err) {
            return err.message;
          }
        },
      });
      const colour = colourInput.trim() || null;
      if (colour) lastColour = colour;

      try {
        const result = exportIcon(selected.icon, {
          colour,
          clean: true,
          score: selected.score,
        });
        recordRecent(result);
        console.log();
        showSuccess(result);
        console.log();
      } catch (err) {
        if (err instanceof ColourError) {
          showError(err.message);
          continue;
        }
        throw err;
      }

      const again = await promptConfirm({
        message: 'Export another icon?',
        default: true,
      });

      if (!again) {
        console.log('\x1b[2mGoodbye!\x1b[0m');
        break;
      }
    } catch (err) {
      if (isExitError(err)) {
        console.log('\n\x1b[2mGoodbye!\x1b[0m');
        break;
      }
      throw err;
    }
  }
}

async function handleEmptyQuery(opts, runInteractiveFn) {
  if (!opts.quiet) {
    ensureCatalogue();
    showBanner();
  }
  await showEmptyStateLanding();

  if (process.stdin.isTTY) {
    try {
      const startInteractive = await promptConfirm({
        message: 'Start interactive mode?',
        default: true,
      });
      if (startInteractive) {
        await runInteractiveFn({ quiet: opts.quiet });
        return;
      }
    } catch (err) {
      if (isExitError(err)) return;
      throw err;
    }
  }

  showHelp();
}

function findIconBySlug(slug) {
  const needle = slug.toLowerCase().trim();
  return getCatalogue().find((i) => i.slug === needle || i.filename === needle);
}

function sharedExportOptions(cmd) {
  return cmd
    .option('-c, --color <colour>', 'Fill colour: hex, named, currentColor, or none')
    .option('-o, --output <file>', 'Custom output filename (- for stdout)')
    .option('-y, --yes', 'Skip disambiguation; take top match')
    .option('--no-clean', 'Keep Font Awesome comment in output')
    .option('--no-overwrite', 'Do not overwrite existing files')
    .option('--no-legacy', 'Exclude legacy (-alt) icons')
    .option('--stdout', 'Write SVG to stdout')
    .option('--dry-run', 'Preview export without writing')
    .option('--suffix-colour', 'Append colour to output filename')
    .option('--prefix <text>', 'Prefix output filename')
    .option('--open', 'Open exported file')
    .option('--reveal, --finder', 'Reveal in file manager')
    .option('--copy-path', 'Copy output path to clipboard')
    .option('--json', 'Output result as JSON')
    .option('-q, --quiet', 'Suppress banner');
}

function cmdOpts(command) {
  return command.optsWithGlobals();
}

function exportOptionsFromOpts(opts) {
  const mapped = {
    colour: opts.color ?? null,
    outputName: opts.output ?? null,
    yes: opts.yes,
    clean: opts.clean !== false,
    noOverwrite: opts.overwrite === false,
    noLegacy: opts.legacy === false,
    dryRun: opts.dryRun,
    stdout: opts.stdout,
    open: opts.open,
    reveal: opts.reveal,
    copyPath: opts.copyPath,
    suffixColour: opts.suffixColour,
    prefix: opts.prefix ?? null,
    asJson: opts.json,
    quiet: opts.quiet,
  };
  // #region agent log
  fetch('http://127.0.0.1:7421/ingest/6ce5449b-ab97-4ed8-9bc3-95d5b305406c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c31548'},body:JSON.stringify({sessionId:'c31548',location:'cli.js:exportOptionsFromOpts',message:'commander opts mapped',data:{raw:{clean:opts.clean,overwrite:opts.overwrite,legacy:opts.legacy,noClean:opts.noClean,noOverwrite:opts.noOverwrite,noLegacy:opts.noLegacy},mapped:{clean:mapped.clean,noOverwrite:mapped.noOverwrite,noLegacy:mapped.noLegacy}},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return mapped;
}

export function run(argv) {
  const program = new Command();

  program
    .name('zsm')
    .description('ZSM Icons — fuzzy-search, recolour, and export SVG icons')
    .version(version, '-V, --version', 'Show version number');

  sharedExportOptions(
    program
      .argument('[query...]', 'Icon name (fuzzy match)')
      .action(async function (queryParts) {
        const opts = cmdOpts(this);
        const query = (queryParts ?? []).join(' ').trim();
        if (!query) {
          await handleEmptyQuery(opts, runInteractive);
          return;
        }

        ensureCatalogue({ quiet: opts.quiet || opts.json || opts.stdout });
        if (!opts.quiet && !opts.json && !opts.stdout) showBanner();

        await resolveAndExport(query, exportOptionsFromOpts(opts));
      }),
  );

  program
    .command('search')
    .description('Search icons without exporting')
    .argument('<query...>', 'Search query')
    .option('-n, --limit <n>', 'Max results', '15')
    .option('--no-legacy', 'Exclude legacy (-alt) icons')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress banner')
    .action(function (queryParts) {
      const opts = cmdOpts(this);
      const query = (queryParts ?? []).join(' ').trim();
      if (!query) {
        showError('Search query is required.');
        process.exit(EXIT_INVALID);
      }

      ensureCatalogue({ quiet: opts.quiet || opts.json });
      if (!opts.quiet && !opts.json) showBanner();

      const limit = parseInt(opts.limit, 10);
      if (Number.isNaN(limit) || limit < 1) {
        showError('Invalid --limit value.');
        process.exit(EXIT_INVALID);
      }

      const noLegacy = opts.legacy === false;
      // #region agent log
      fetch('http://127.0.0.1:7421/ingest/6ce5449b-ab97-4ed8-9bc3-95d5b305406c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c31548'},body:JSON.stringify({sessionId:'c31548',location:'cli.js:search',message:'search no-legacy flag',data:{legacy:opts.legacy,noLegacy,noLegacyProp:opts.noLegacy},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const results = searchIcons(query, limit, { noLegacy });
      if (!results.length) {
        if (opts.json) {
          console.log(JSON.stringify({ query, count: 0, results: [] }));
        } else {
          showNoMatch(query, []);
        }
        process.exit(EXIT_ERROR);
      }

      if (opts.json) {
        console.log(JSON.stringify(formatJsonSearchResults(query, results), null, 2));
      } else {
        showMatchTable(results, `Search: '${query}'`);
      }
    });

  program
    .command('list')
    .description('Browse available icons')
    .argument('[filter...]', 'Optional filter substring')
    .option('-n, --limit <n>', 'Max icons to show', '50')
    .option('--no-legacy', 'Exclude legacy (-alt) icons')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress banner')
    .action(function (filterParts) {
      const opts = cmdOpts(this);
      const filterText = (filterParts ?? []).join(' ').trim() || null;
      const noLegacy = opts.legacy === false;
      ensureCatalogue({ quiet: opts.quiet || opts.json });
      if (!opts.quiet && !opts.json) showBanner();

      const limit = parseInt(opts.limit, 10);
      if (Number.isNaN(limit) || limit < 1) {
        showError('Invalid --limit value.');
        process.exit(EXIT_INVALID);
      }

      let icons = getCatalogue();
      if (noLegacy) icons = icons.filter((i) => !i.isLegacy);
      if (filterText) {
        const needle = filterText.toLowerCase().replace(/ /g, '-');
        icons = icons.filter((i) => i.slug.includes(needle));
      }

      const total = icons.length;
      const display = icons.slice(0, limit);

      if (opts.json) {
        console.log(JSON.stringify(formatJsonIconList(filterText, display, total), null, 2));
      } else {
        showIconList(filterText, limit, { noLegacy });
      }
    });

  program
    .command('info')
    .description('Show icon metadata without exporting')
    .argument('<slug>', 'Icon slug or filename')
    .option('--verbose', 'Include search keys')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress banner')
    .action(function (slug) {
      const opts = cmdOpts(this);
      ensureCatalogue({ quiet: opts.quiet || opts.json });
      if (!opts.quiet && !opts.json) showBanner();

      const icon = findIconBySlug(slug);
      if (!icon) {
        if (opts.json) {
          console.log(JSON.stringify({ error: 'not found', slug }));
        } else {
          showNoMatch(slug, searchIcons(slug, 3));
        }
        process.exit(EXIT_ERROR);
      }

      if (opts.json) {
        const data = {
          slug: icon.slug,
          filename: icon.filename,
          legacy: icon.isLegacy,
          source: icon.path,
        };
        if (opts.verbose) data.searchKeys = icon.searchKeys;
        console.log(JSON.stringify(data, null, 2));
      } else {
        showIconInfo(icon, { verbose: opts.verbose });
      }
    });

  program
    .command('path')
    .description('Show resolved icon and output paths')
    .option('--json', 'Output as JSON')
    .action(function () {
      const opts = cmdOpts(this);
      ensureCatalogue({ quiet: true });

      if (opts.json) {
        console.log(
          JSON.stringify(
            { icons: iconsDir(), output: outputDir(), config: configFilePath() },
            null,
            2,
          ),
        );
      } else {
        showPaths();
      }
    });

  program
    .command('recent')
    .description('List or re-export recent icons')
    .argument('[index]', 'Re-export entry by number')
    .option('-q, --quiet', 'Suppress banner')
    .action(async function (index) {
      const opts = cmdOpts(this);
      ensureCatalogue({ quiet: opts.quiet });
      if (!opts.quiet) showBanner();

      const entries = getRecentExports();

      if (!index) {
        showRecentList(entries);
        return;
      }

      const n = parseInt(index, 10);
      if (Number.isNaN(n) || n < 1) {
        showError('Invalid index. Use a number from the recent list.');
        process.exit(EXIT_INVALID);
      }

      const entry = getRecentExport(n);
      if (!entry) {
        showError(`No recent export at index ${n}.`);
        process.exit(EXIT_ERROR);
      }

      const icon = findIconBySlug(entry.slug);
      if (!icon) {
        showError(`Icon '${entry.slug}' no longer in catalogue.`);
        process.exit(EXIT_ERROR);
      }

      const result = exportIcon(icon, { colour: entry.colour, clean: true, score: entry.score });
      recordRecent(result);
      showSuccess(result);
    });

  program
    .command('batch')
    .alias('export')
    .description('Export multiple icons')
    .argument('<icons...>', 'Icon names (fuzzy match)')
    .option('-c, --color <colour>', 'Fill colour for all icons')
    .option('-y, --yes', 'Skip disambiguation (required for batch)')
    .option('--no-legacy', 'Exclude legacy (-alt) icons')
    .option('--json', 'Output results as JSON')
    .option('-q, --quiet', 'Suppress banner')
    .action(async function (icons) {
      const opts = cmdOpts(this);
      if (!opts.yes) {
        showError('Batch export requires -y to skip disambiguation for each icon.');
        process.exit(EXIT_INVALID);
      }

      ensureCatalogue({ quiet: opts.quiet || opts.json });
      if (!opts.quiet && !opts.json) showBanner();

      const batchResults = [];

      for (const query of icons) {
        try {
          const { best } = pickBestMatch(query, { noLegacy: opts.legacy === false });
          if (!best) {
            batchResults.push({ query, ok: false, error: 'no match' });
            continue;
          }
          const result = exportIcon(best.icon, {
            colour: opts.color ?? null,
            clean: true,
            score: best.score,
          });
          recordRecent(result);
          batchResults.push({ query, ok: true, result });
        } catch (err) {
          batchResults.push({ query, ok: false, error: err.message });
        }
      }

      if (opts.json) {
        console.log(
          JSON.stringify(
            {
              exported: batchResults.filter((r) => r.ok).length,
              failed: batchResults.filter((r) => !r.ok).length,
              results: batchResults.map((r) =>
                r.ok
                  ? { query: r.query, ...formatJsonExport(r.result) }
                  : { query: r.query, error: r.error },
              ),
            },
            null,
            2,
          ),
        );
      } else {
        showBatchSummary(batchResults);
      }

      if (batchResults.some((r) => !r.ok)) {
        process.exit(EXIT_ERROR);
      }
    });

  program
    .command('interactive')
    .alias('i')
    .description('Interactive mode — search, recolour, and export in a loop')
    .option('-q, --quiet', 'Suppress banner')
    .action(async function () {
      const opts = cmdOpts(this);
      await runInteractive({ quiet: opts.quiet });
    });

  program
    .command('completion')
    .description('Generate shell completion script')
    .argument('<shell>', 'Shell: bash, zsh, or fish')
    .action(function (shell) {
      try {
        console.log(generateCompletion(shell.toLowerCase(), program));
      } catch (err) {
        showError(err.message);
        process.exit(EXIT_INVALID);
      }
    });

  program
    .command('help')
    .description('Show help and examples')
    .action(() => {
      ensureCatalogue();
      showHelp();
    });

  program.parse(argv);
}
