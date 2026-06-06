# Developer guide

Notes for people working on or contributing to ZSM Icons.

## Setup from source

```bash
git clone https://github.com/ZSMDigital/zsm-icons.git
cd zsm-icons
npm install
npm link
```

`npm link` registers the `zsm` command globally on your machine. To run without linking:

```bash
npm start -- cog -c blue
# or
node bin/zsm.js cog -c blue
```

Other useful scripts:

```bash
npm run gen-synonyms  # rebuild src/synonyms.js (see below)
```

## Project structure

```
zsm-icons/
├── bin/zsm.js          Entry point
├── src/                CLI logic
├── icons/              Font Awesome Free SVGs (bundled)
├── scripts/            Maintainer scripts
├── LICENSE             MIT licence (this project's code)
├── NOTICE              Font Awesome attribution
└── DEVS.md             This file
```

### Key modules

| File | Role |
|------|------|
| `src/cli.js` | Commander setup, commands, interactive mode |
| `src/search.js` | Fuzzy matching via fuzzball |
| `src/synonyms.js` | Font Awesome alias map for search |
| `src/export.js` | Read icon, recolour, write output |
| `src/colorize.js` | Colour parsing and SVG fill replacement |
| `src/index.js` | Icon catalogue builder |
| `scripts/gen-synonyms.mjs` | Regenerate `synonyms.js` from JSON |

## Regenerating synonyms

Fuzzy search uses a synonym map in `src/synonyms.js`. To rebuild it:

1. Place alias data in `src-synonyms-temp.json` at the repo root (gitignored).
2. Run `npm run gen-synonyms`.

## Licensing (for maintainers)

- **Project code:** [MIT License](LICENSE)
- **Icon SVGs in `icons/`:** [Font Awesome Free 7.2.0](https://fontawesome.com), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See [NOTICE](NOTICE).

When shipping or updating the icon bundle:

- Keep attribution comments in source SVG files under `icons/`.
- **Do not** add Font Awesome Pro icons — they require a separate commercial licence.
- Brand logos must only represent the company or product they refer to.

The CLI strips attribution from exported SVGs by default (`clean: true`). Users can pass `--no-clean` to retain it. Document this for anyone redistributing exported files.

## Contributing

Issues and pull requests are welcome.

- Keep Font Awesome attribution comments intact in `icons/`.
- Match existing code style and module layout in `src/`.
- Test locally: `node bin/zsm.js search cog -q --json`, `node bin/zsm.js cog -y --dry-run`.
