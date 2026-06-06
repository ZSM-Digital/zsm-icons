# ZSM Icons

A command-line tool to **fuzzy-search** [Font Awesome Free](https://fontawesome.com) icons, **recolour** them, and **export** SVG files to your Downloads folder (or a custom location).

## Requirements

- **Node.js 18+** ([nodejs.org](https://nodejs.org))

## Installation

Clone the repo, install dependencies, and register the `zsm` command:

```bash
git clone https://github.com/ZSM-Digital/zsm-icons.git
cd zsm-icons
npm install
npm link
```

You can also run it without linking:

```bash
node bin/zsm.js cog -c blue
```

For development and contributing, see [DEVS.md](DEVS.md).

## Quick start

```bash
# Fuzzy find and export (opens disambiguation if needed)
zsm cog

# Recolour and export
zsm left arrow -c red
zsm cog --color "#3b82f6"

# Skip the picker when the top match is good enough
zsm serch -y -c blue

# Export to stdout (for scripts)
zsm cog -c red --stdout > ./assets/cog.svg

# Interactive mode — search, recolour, export in a loop
zsm i
```

Exported files go to your **Downloads** folder by default. Override with the `ZSM_OUTPUT_DIR` environment variable or a config file (see [Configuration](#configuration)).

## Commands

| Command | Description |
|---------|-------------|
| `zsm <icon>` | Fuzzy find and export an icon |
| `zsm search <query>` | Search without exporting |
| `zsm list [filter]` | Browse available icons |
| `zsm info <slug>` | Show icon metadata |
| `zsm path` | Show resolved icon and output paths |
| `zsm recent [n]` | List recent exports, or re-export entry `n` |
| `zsm batch <icons...>` | Export multiple icons (requires `-y`) |
| `zsm i` / `zsm interactive` | Interactive export loop |
| `zsm completion <shell>` | Generate shell completions (`bash`, `zsh`, `fish`) |
| `zsm help` | Show help and examples |

Run `zsm` with no arguments to see a quick tip and optionally enter interactive mode.

## Options

These apply to the main export command (`zsm <icon>`) and `zsm batch`:

| Option | Description |
|--------|-------------|
| `-c, --color <colour>` | Fill colour: hex (`#ff0000`), named (`red`), `currentColor`, or `none` |
| `-o, --output <file>` | Custom output filename (`-` for stdout) |
| `-y, --yes` | Skip disambiguation; use the top match |
| `--stdout` | Write SVG to stdout instead of a file |
| `--dry-run` | Preview export without writing |
| `--no-clean` | Keep the Font Awesome attribution comment in the output SVG |
| `--no-overwrite` | Do not overwrite an existing output file |
| `--no-legacy` | Exclude legacy (`-alt`) icon variants |
| `--suffix-colour` | Append colour to the output filename |
| `--prefix <text>` | Prefix the output filename |
| `--open` | Open the exported file after writing |
| `--reveal, --finder` | Reveal the file in your file manager |
| `--copy-path` | Copy the output path to the clipboard |
| `--json` | Output result as JSON |
| `-q, --quiet` | Suppress the banner |
| `-V, --version` | Show version |

### Search and list

```bash
zsm search magnifying -n 10 --json
zsm list arrow --no-legacy
zsm info cog --verbose
```

## Configuration

### Output directory

Priority (highest first):

1. **`ZSM_OUTPUT_DIR`** environment variable
2. **Config file** `outputDir` setting
3. **`~/Downloads`** (default)

**Windows config:** `%APPDATA%\zsm\config.json`  
**macOS / Linux config:** `~/.config/zsm/config.json`

Example config:

```json
{
  "outputDir": "C:\\Users\\you\\Projects\\assets\\icons"
}
```

### Recent exports

The last 10 exports are stored locally:

- **Windows:** `%LOCALAPPDATA%\zsm\recent.json`
- **macOS / Linux:** `~/.cache/zsm/recent.json`

Re-export from the list:

```bash
zsm recent
zsm recent 2
```

## Shell completion

```bash
# Bash — add to ~/.bashrc
eval "$(zsm completion bash)"

# Zsh — add to ~/.zshrc
eval "$(zsm completion zsh)"

# Fish — save to completions path
zsm completion fish > ~/.config/fish/completions/zsm.fish
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | No match or user-facing error |
| `2` | Invalid arguments |

## Examples

```bash
# Typo-tolerant search
zsm serch -y -c "#22c55e"

# Batch export with shared colour
zsm batch cog star heart -y -c white

# Preview without writing
zsm cog -c blue --dry-run

# Export and reveal in Explorer / Finder
zsm cog --reveal

# Machine-readable output for scripts
zsm cog -y --json
zsm search settings --json
```

## Licensing

Icons are from [Font Awesome Free](https://fontawesome.com) (CC BY 4.0). Project code is MIT. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Use `--no-clean` if you need attribution kept in exported SVGs.
