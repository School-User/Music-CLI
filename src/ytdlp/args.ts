import path from "node:path";

/** yt-dlp audio extraction args: always extract best-available, no re-encode. */
export function audioFormatArgs(): string[] {
  return ["-x"];
}

/** Browsers yt-dlp can read login cookies from (--cookies-from-browser). */
export const COOKIE_BROWSERS = [
  "chrome",
  "firefox",
  "edge",
  "brave",
  "opera",
  "vivaldi",
  "chromium",
  "safari",
] as const;

export type CookieBrowser = (typeof COOKIE_BROWSERS)[number];

/**
 * Args that make yt-dlp reuse the user's browser login, unlocking the
 * premium-quality streams their account is entitled to (YouTube Premium
 * 256k AAC, SoundCloud Go+). A value not in COOKIE_BROWSERS (hand-edited
 * config) is ignored rather than failing every download.
 */
export function cookieArgs(browser?: string): string[] {
  return browser && (COOKIE_BROWSERS as ReadonlyArray<string>).includes(browser)
    ? ["--cookies-from-browser", browser]
    : [];
}

/**
 * Output filename template:
 *   <library>/<Source>/<owner?>/<Playlist or "Singles">/<Artist> - <Title>.<ext>
 * Uses yt-dlp field alternation (artist then uploader) with sensible defaults.
 * The owner segment (the normalized handle) keeps collections from different
 * handles apart on disk.
 */
export function outputTemplate(
  libraryDir: string,
  sourceLabel: string,
  owner?: string,
): string {
  return path.join(
    libraryDir,
    sourceLabel,
    ...(owner ? [sanitizeName(owner)] : []),
    "%(playlist_title|Singles)s",
    "%(artist,uploader|Unknown Artist)s - %(track,title)s.%(ext)s",
  );
}

/** Remove characters that are illegal in filenames across OSes. */
export function sanitizeName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return cleaned || "track";
}

/**
 * Output template with a caller-supplied folder but yt-dlp's own filename.
 * Used by YouTube/SoundCloud so a single-track download (which has no
 * playlist_title of its own under --no-playlist) still lands in the playlist /
 * "Liked Songs" folder it came from, instead of falling back to "Singles".
 */
export function outputTemplateInFolder(
  libraryDir: string,
  sourceLabel: string,
  playlist: string,
  owner?: string,
): string {
  return path.join(
    libraryDir,
    sourceLabel,
    ...(owner ? [sanitizeName(owner)] : []),
    sanitizeName(playlist),
    "%(artist,uploader|Unknown Artist)s - %(track,title)s.%(ext)s",
  );
}

/**
 * Output template with caller-supplied playlist + filename (used by Spotify,
 * where names come from Spotify rather than the matched YouTube video).
 */
export function outputTemplateFixed(
  libraryDir: string,
  sourceLabel: string,
  playlist: string,
  stem: string,
): string {
  return path.join(
    libraryDir,
    sourceLabel,
    sanitizeName(playlist),
    `${sanitizeName(stem)}.%(ext)s`,
  );
}
