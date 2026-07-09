// Central visual vocabulary for the TUI: one place for accent colors and the
// small glyph set we trust to render in a terminal. Keeping these here means
// every section speaks the same visual language instead of each picking its own.

import { defaultTheme, extendTheme } from "@inkjs/ui";

/** The palette slots every theme must fill. */
export interface Palette {
  /** Brand accent. Used for focus, cursors, and progress. */
  accent: string;
  /** Prominent body text, softened so it doesn't read as harsh default-white. */
  text: string;
  /** Secondary accent for paths, inline keys, and group headers. */
  alt: string;
  /** Now-playing / success, kept clearly apart from the accent. */
  good: string;
  /** Warnings (rate limits, empty results). */
  warn: string;
  /** Failures, pushed away from the accent so errors never read as brand. */
  bad: string;
  /** The bright end of the accent ramp (glow sweeps, saves-to path). */
  amber: string;
}

/**
 * Selectable themes (Settings -> Appearance). "ember" is the classic look;
 * the rest re-tint the accent family while keeping good/warn/bad readable
 * and semantically apart from the accent.
 */
export const THEMES: Record<string, Palette> = {
  ember: {
    accent: "#ff6a3d",
    text: "#ece4da",
    alt: "#e0b380",
    good: "#86d6a2",
    warn: "#f0c560",
    bad: "#ee7d92",
    amber: "#ffb163",
  },
  ocean: {
    accent: "#4da3ff",
    text: "#dfe8f2",
    alt: "#8fc7d9",
    good: "#7fd8b0",
    warn: "#e8c46a",
    bad: "#ef7d9b",
    amber: "#7cc4ff",
  },
  forest: {
    accent: "#5fbf6e",
    text: "#e4ecdf",
    alt: "#b8c98a",
    good: "#8fd8c5",
    warn: "#e5c25f",
    bad: "#e07d88",
    amber: "#a3d977",
  },
  violet: {
    accent: "#a983ff",
    text: "#e9e4f2",
    alt: "#c6a3d9",
    good: "#84d6ae",
    warn: "#e8c46a",
    bad: "#f07d92",
    amber: "#d0a3ff",
  },
  mono: {
    accent: "#d8d8d8",
    text: "#e8e8e8",
    alt: "#a8a8a8",
    good: "#9fd8a9",
    warn: "#d8c88f",
    bad: "#d88f9b",
    amber: "#f2f2f2",
  },
};

export const DEFAULT_THEME = "ember";

/**
 * The live palette every component reads at render time. Mutated in place by
 * applyTheme so a theme switch shows up on the next render without threading
 * a palette prop through every component. Nothing may capture these values at
 * module load (derive inside render or via accentRamp()).
 */
export const COLOR: Palette = { ...THEMES[DEFAULT_THEME]! };

/** Swap the live palette. Unknown names (hand-edited config) keep the default. */
export function applyTheme(name?: string): void {
  Object.assign(COLOR, THEMES[name ?? DEFAULT_THEME] ?? THEMES[DEFAULT_THEME]!);
}

/** Theme names in menu order (default first). */
export function themeNames(): string[] {
  return Object.keys(THEMES);
}

/**
 * Glyphs known to render in Windows Terminal, macOS Terminal, and common Linux
 * emulators. Kept deliberately tiny.
 */
export const ICON = {
  play: "▶",
  pause: "⏸",
  done: "✓",
  error: "✗",
  canceled: "⊘",
  skipped: "•",
  pending: "·",
  pointer: "❯",
  dot: "·",
  warn: "⚠",
  shuffle: "⇄",
  repeat: "↻",
  /** Solid left edge used to mark the active nav row. */
  bar: "▌",
} as const;

/** A soft warm gray used for separators and rules so they recede behind content. */
export const RULE = "#6b635d";

/** Parse "#rrggbb" into [r, g, b]. */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Linear-interpolate two "#rrggbb" colors; t in [0, 1]. */
export function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const c = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}

/**
 * The accent's glow ramp (accent → its bright end). Progress fills and the
 * wordmark sweep this same pair, so the accent reads as one material
 * throughout the app instead of a flat fill. A function, not a constant:
 * it must follow the live palette when the theme changes.
 */
export function accentRamp(): readonly [string, string] {
  return [COLOR.accent, COLOR.amber];
}

/**
 * @inkjs/ui theme override so its Select and Spinner share our orange accent
 * instead of their default green/blue. Without this the list cursor and
 * loading spinners would clash with the brand color.
 */
export const uiTheme = extendTheme(defaultTheme, {
  components: {
    Select: {
      styles: {
        focusIndicator: () => ({ color: COLOR.accent }),
        selectedIndicator: () => ({ color: COLOR.accent }),
        label: (props: { isFocused?: boolean; isSelected?: boolean } = {}) => ({
          color: props.isFocused || props.isSelected ? COLOR.accent : undefined,
        }),
      },
    },
    Spinner: {
      styles: {
        frame: () => ({ color: COLOR.accent }),
      },
    },
  },
});
