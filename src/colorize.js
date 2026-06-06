const NAMED_COLOURS = {
  white: '#ffffff',
  black: '#000000',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  grey: '#808080',
  gray: '#808080',
  silver: '#c0c0c0',
  gold: '#ffd700',
  brown: '#a52a2a',
  navy: '#000080',
  teal: '#008080',
  lime: '#00ff00',
  maroon: '#800000',
  olive: '#808000',
  aqua: '#00ffff',
  coral: '#ff7f50',
  crimson: '#dc143c',
  indigo: '#4b0082',
  violet: '#ee82ee',
  turquoise: '#40e0d0',
  salmon: '#fa8072',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  beige: '#f5f5dc',
  ivory: '#fffff0',
  azure: '#007fff',
  skyblue: '#87ceeb',
  'sky-blue': '#87ceeb',
  midnightblue: '#191970',
  'midnight-blue': '#191970',
  forestgreen: '#228b22',
  'forest-green': '#228b22',
  seagreen: '#2e8b57',
  'sea-green': '#2e8b57',
  tomato: '#ff6347',
  orangered: '#ff4500',
  'orange-red': '#ff4500',
  hotpink: '#ff69b4',
  'hot-pink': '#ff69b4',
  deeppink: '#ff1493',
  'deep-pink': '#ff1493',
  lightgray: '#d3d3d3',
  'light-gray': '#d3d3d3',
  darkgray: '#a9a9a9',
  'dark-gray': '#a9a9a9',
  slategray: '#708090',
  'slate-gray': '#708090',
  transparent: 'none',
};

const FA_COMMENT_PATTERN = /<!--.*?-->/gs;
const FILL_PATTERN = /fill="#ffffff"/g;

export class ColourError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ColourError';
  }
}

export function resolveColour(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ColourError('Colour value cannot be empty.');
  }

  const lower = trimmed.toLowerCase();

  if (lower === 'currentcolor') return 'currentColor';
  if (lower === 'none' || lower === 'transparent') return 'none';
  if (lower in NAMED_COLOURS) return NAMED_COLOURS[lower];

  let hexVal = lower.startsWith('#') ? lower.slice(1) : lower;

  if (/^[0-9a-f]{3}$/.test(hexVal)) {
    hexVal = [...hexVal].map((c) => c + c).join('');
  } else if (!/^[0-9a-f]{6}$/.test(hexVal) && !/^[0-9a-f]{8}$/.test(hexVal)) {
    throw new ColourError(
      `Invalid colour '${value}'. Use hex (#ff5500), a named colour (red), currentColor, or none.`,
    );
  }

  return `#${hexVal}`;
}

export function applyColour(svg, colour) {
  if (!colour) return { svg, resolved: null };

  const resolved = resolveColour(colour);
  const modified =
    resolved === 'none'
      ? svg.replace(FILL_PATTERN, 'fill="none"')
      : svg.replace(FILL_PATTERN, `fill="${resolved}"`);

  return { svg: modified, resolved };
}

export function stripComment(svg) {
  return svg.replace(FA_COMMENT_PATTERN, '');
}
