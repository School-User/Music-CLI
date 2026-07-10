import { promises as fs } from "node:fs";
import path from "node:path";
import { parseSpotifyInput } from "../sources/spotify/public";
import { normalizeSpotifyHandle } from "../sources/spotify/handle";
import { configFile, defaultLibraryDir } from "./paths";
import { resolveDefaultLibraryDir } from "./music-dir";

export interface Config {
  /** Where downloaded audio files live. */
  libraryDir: string;
  /** The user's YouTube handle (public playlists). */
  youtubeHandle?: string;
  /** The user's SoundCloud handle (public likes + sets). */
  soundcloudHandle?: string;
  /** The user's Spotify username (public playlists on their profile). */
  spotifyHandle?: string;
  /** @deprecated Migrated to spotifyHandle when it was a user id. */
  spotifyProfile?: string;
  /** Whether the first-run wizard has completed. */
  firstRunComplete: boolean;
  /** Check for yt-dlp updates at every launch (staged, applied when idle). */
  ytdlpAutoUpdate?: boolean;
  /**
   * Browser whose login cookies downloads reuse (yt-dlp
   * --cookies-from-browser), for premium-quality streams. Unset = logged out.
   */
  cookiesFromBrowser?: string;
  /**
   * Custom player keybinds: action name -> single-character key (see
   * ui/keybinds.ts for the actions). Unset actions keep their defaults;
   * invalid or conflicting entries are ignored at resolve time.
   */
  keybinds?: Record<string, string>;
  /** Color theme name (see ui/theme.ts THEMES). Unset = the default look. */
  theme?: string;
  /**
   * Download full video (best video+audio merged to mp4) instead of extracting
   * audio. Applies to single tracks and whole playlists. Videos open in the
   * system player on play, since a terminal can't show video. Unset = audio.
   */
  downloadVideo?: boolean;
}

/** Drop deprecated keys before returning config or writing it to disk. */
export function stripDeprecatedConfig(config: Config): Config {
  const { spotifyProfile: _, ...rest } = config;
  return rest;
}

export const defaultConfig: Config = {
  libraryDir: defaultLibraryDir,
  youtubeHandle: undefined,
  soundcloudHandle: undefined,
  spotifyHandle: undefined,
  spotifyProfile: undefined,
  firstRunComplete: false,
  ytdlpAutoUpdate: true,
  cookiesFromBrowser: undefined,
  keybinds: undefined,
  theme: undefined,
  downloadVideo: undefined,
};

export async function loadConfig(): Promise<Config> {
  let raw: string;
  try {
    raw = await fs.readFile(configFile, "utf8");
  } catch {
    // True first run (no config yet): ask the OS where Music really lives.
    // Once a config file exists this never runs again, so the registry is
    // queried at most once per machine.
    return { ...defaultConfig, libraryDir: await resolveDefaultLibraryDir() };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Config>;
    const cfg = { ...defaultConfig, ...parsed };
    if (!cfg.spotifyHandle && parsed.spotifyProfile) {
      const ref = parseSpotifyInput(parsed.spotifyProfile);
      if (ref.type === "user") {
        cfg.spotifyHandle = normalizeSpotifyHandle(parsed.spotifyProfile);
      }
    }
    return stripDeprecatedConfig(cfg);
  } catch {
    return { ...defaultConfig };
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await fs.mkdir(path.dirname(configFile), { recursive: true });
  await fs.writeFile(
    configFile,
    JSON.stringify(stripDeprecatedConfig(config), null, 2),
    "utf8",
  );
  // Pre-create the music folder so downloads and "open folder" always land
  // somewhere real; a bad path must never break a config save.
  await fs.mkdir(config.libraryDir, { recursive: true }).catch(() => {});
}
