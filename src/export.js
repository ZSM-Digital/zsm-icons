import fs from 'fs';
import path from 'path';
import { applyColour, stripComment } from './colorize.js';
import { iconsDir, ensureOutputDir } from './paths.js';

function colourSuffix(resolved) {
  if (!resolved || resolved === 'currentColor') return null;
  if (resolved === 'none') return 'none';
  return resolved.replace(/^#/, '').toLowerCase();
}

function buildFilename(icon, { outputName, colour, suffixColour, prefix }) {
  let filename = outputName || icon.filename;
  if (!filename.endsWith('.svg')) filename += '.svg';

  const base = path.basename(filename, '.svg');
  const ext = '.svg';
  let name = base;

  if (prefix) name = `${prefix}${name}`;
  if (suffixColour && colour) {
    const suffix = colourSuffix(colour);
    if (suffix) name = `${name}-${suffix}`;
  }

  return `${name}${ext}`;
}

export function prepareExport(icon, options = {}) {
  const {
    colour = null,
    outputName = null,
    clean = true,
    noOverwrite = false,
    score = 100,
    stdout = false,
    suffixColour = false,
    prefix = null,
  } = options;

  const source = path.join(iconsDir(), icon.filename);
  if (!fs.existsSync(source)) {
    throw new Error(`Icon not found: ${source}`);
  }

  let svg = fs.readFileSync(source, 'utf-8');
  if (clean) svg = stripComment(svg);

  const { svg: coloured, resolved } = applyColour(svg, colour);

  let outputPath = null;
  let overwritten = false;

  if (!stdout) {
    const outDir = ensureOutputDir();
    const filename = buildFilename(icon, { outputName, colour: resolved, suffixColour, prefix });
    outputPath = path.join(outDir, filename);
    overwritten = fs.existsSync(outputPath);

    if (overwritten && noOverwrite) {
      throw new Error(`Output already exists: ${outputPath}`);
    }
  }

  return {
    icon,
    sourcePath: source,
    outputPath,
    svg: coloured,
    colour: resolved,
    overwritten,
    score,
    stdout,
  };
}

export function exportIcon(icon, options = {}) {
  const { dryRun = false, stdout = false, ...rest } = options;
  const prepared = prepareExport(icon, { ...rest, stdout });

  if (dryRun) {
    return { ...prepared, dryRun: true };
  }

  if (stdout) {
    process.stdout.write(prepared.svg);
    return { ...prepared, outputPath: null, overwritten: false };
  }

  fs.writeFileSync(prepared.outputPath, prepared.svg, 'utf-8');

  return prepared;
}
