const ICON_SLUG_CAP = 500;

export function generateCompletion(shell, program) {
  const commands = program.commands.map((c) => c.name()).filter((n) => n !== 'help');
  const globalOpts = ['-c', '--color', '-o', '--output', '-y', '--yes', '--json', '-q', '--quiet', '-V', '--version'];
  const searchOpts = ['-n', '--limit', '--json', '-q', '--quiet', '--no-legacy'];
  const listOpts = ['-n', '--limit', '--json', '-q', '--quiet'];
  const exportOpts = [
    '-c', '--color', '-o', '--output', '-y', '--yes', '--stdout', '--dry-run',
    '--no-clean', '--no-overwrite', '--no-legacy', '--json', '-q', '--quiet',
    '--open', '--reveal', '--copy-path', '--suffix-colour', '--prefix',
  ];

  if (shell === 'bash') {
    return `# zsm bash completion
_zsm_completions() {
  local cur prev opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  opts="${commands.join(' ')} help interactive i path info recent batch export completion"

  if [[ \${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
    return 0
  fi

  case "\${COMP_WORDS[1]}" in
    search)
      COMPREPLY=( $(compgen -W "${searchOpts.join(' ')}" -- \${cur}) )
      ;;
    list)
      COMPREPLY=( $(compgen -W "${listOpts.join(' ')}" -- \${cur}) )
      ;;
    completion)
      COMPREPLY=( $(compgen -W "bash zsh fish" -- \${cur}) )
      ;;
    *)
      COMPREPLY=( $(compgen -W "${exportOpts.join(' ')}" -- \${cur}) )
      ;;
  esac
  return 0
}
complete -F _zsm_completions zsm
`;
  }

  if (shell === 'zsh') {
    return `# zsm zsh completion
#compdef zsm

_zsm() {
  local -a commands opts
  commands=(
    'search:Search icons without exporting'
    'list:Browse available icons'
    'interactive:Interactive mode'
    'i:Interactive mode'
    'info:Show icon metadata'
    'path:Show resolved paths'
    'recent:Recent exports'
    'batch:Batch export icons'
    'export:Batch export icons'
    'completion:Generate shell completions'
    'help:Show help'
  )
  opts=(
    '-c[Colour]' '--color[Colour]'
    '-o[Output file]' '--output[Output file]'
    '-y[Skip disambiguation]' '--yes[Skip disambiguation]'
    '--stdout[Write SVG to stdout]'
    '--dry-run[Preview without writing]'
    '--json[JSON output]'
    '-q[Quiet]' '--quiet[Quiet]'
    '--open[Open exported file]'
    '--reveal[Reveal in file manager]'
    '--copy-path[Copy path to clipboard]'
    '--no-legacy[Exclude legacy icons]'
  )

  _arguments -C \\
    '1: :->command' \\
    '*:: :->args'

  case $state in
    command) _describe 'command' commands ;;
    args)
      case $words[1] in
        completion) _values 'shell' bash zsh fish ;;
        *) _describe 'option' opts ;;
      esac
      ;;
  esac
}

_zsm
`;
  }

  if (shell === 'fish') {
    return `# zsm fish completion
complete -c zsm -f
complete -c zsm -n '__fish_use_subcommand' -a 'search' -d 'Search icons'
complete -c zsm -n '__fish_use_subcommand' -a 'list' -d 'Browse icons'
complete -c zsm -n '__fish_use_subcommand' -a 'interactive' -d 'Interactive mode'
complete -c zsm -n '__fish_use_subcommand' -a 'i' -d 'Interactive mode'
complete -c zsm -n '__fish_use_subcommand' -a 'info' -d 'Icon metadata'
complete -c zsm -n '__fish_use_subcommand' -a 'path' -d 'Resolved paths'
complete -c zsm -n '__fish_use_subcommand' -a 'recent' -d 'Recent exports'
complete -c zsm -n '__fish_use_subcommand' -a 'batch' -d 'Batch export'
complete -c zsm -n '__fish_use_subcommand' -a 'completion' -d 'Shell completions'
complete -c zsm -n '__fish_use_subcommand' -a 'help' -d 'Help'
complete -c zsm -s c -l color -d 'Fill colour'
complete -c zsm -s o -l output -d 'Output filename'
complete -c zsm -s y -l yes -d 'Skip disambiguation'
complete -c zsm -l stdout -d 'Write to stdout'
complete -c zsm -l dry-run -d 'Preview export'
complete -c zsm -l json -d 'JSON output'
complete -c zsm -s q -l quiet -d 'Suppress banner'
complete -c zsm -l reveal -d 'Reveal in file manager'
complete -c zsm -l copy-path -d 'Copy path to clipboard'
complete -c zsm -l no-legacy -d 'Exclude legacy icons'
complete -c zsm -n '__fish_seen_subcommand_from completion' -a 'bash zsh fish'
`;
  }

  throw new Error(`Unsupported shell: ${shell}. Use bash, zsh, or fish.`);
}

export { ICON_SLUG_CAP };
