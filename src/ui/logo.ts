// Block wordmarks for the header. The big one is shown when the terminal is
// wide (and tall) enough; narrower terminals (phones) fall back to the compact
// wordmark so the logo never wraps into a broken grid. App.tsx picks which one
// fits and passes it to <Logo>.

/** Full "MUSIC-CLI" block letters (ANSI-shadow style). */
export const LOGO_LINES: readonly string[] = [
  "███    ███ ██    ██ ███████ ██  ██████        ██████ ██      ██",
  "████  ████ ██    ██ ██      ██ ██            ██      ██      ██",
  "██ ████ ██ ██    ██ ███████ ██ ██      █████ ██      ██      ██",
  "██  ██  ██ ██    ██      ██ ██ ██            ██      ██      ██",
  "██      ██  ██████  ███████ ██  ██████        ██████ ███████ ██",
];

/** Small two-row wordmark for narrow terminals (cfonts "tiny"). */
export const LOGO_LINES_COMPACT: readonly string[] = [
  "█▀▄▀█ █ █ █▀▀ █ █▀▀   █▀▀ █   █",
  "█ ▀ █ █▄█ ▄▄█ █ █▄▄   █▄▄ █▄▄ █",
];

/** Width of the widest row of a wordmark (in terminal columns). */
export function logoWidth(lines: readonly string[]): number {
  return lines.reduce((w, line) => Math.max(w, [...line].length), 0);
}
