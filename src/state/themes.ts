export interface ThemeOption {
  id: string;
  name: string;
  description: string;
  /** Swatch colours in the theme picker, ordered background then accents. */
  swatch: [string, string, string];
}

export const THEMES: ThemeOption[] = [
  {
    id: 'blacklight',
    name: 'Blacklight Studio',
    description: 'Near-black room, charcoal neck, neon green roots and electric purple scale tones.',
    swatch: ['#0e1014', '#3ef08a', '#a855f7'],
  },
  {
    id: 'acid',
    name: 'Acid Stage',
    description: 'Black and graphite with toxic green and small amber accents.',
    swatch: ['#0d0e0c', '#b6ff2e', '#ffb020'],
  },
  {
    id: 'ultraviolet',
    name: 'Ultraviolet',
    description: 'Black with purple, magenta and cool blue.',
    swatch: ['#100c1a', '#c084fc', '#ff2fb3'],
  },
  {
    id: 'studio',
    name: 'Studio Clean',
    description: 'Dark walnut and brass with cream type and a desaturated green root.',
    swatch: ['#1c1712', '#c9a227', '#7c9a72'],
  },
];

export const DEFAULT_THEME_ID = 'blacklight';

export function isThemeId(value: unknown): value is string {
  return typeof value === 'string' && THEMES.some((theme) => theme.id === value);
}
