// One-press library sync: sweep every saved handle and enqueue whatever isn't
// downloaded yet. This is the Settings "Check for new songs" button — the
// explicit way to pull new music without walking the Download flow's pickers.

import type { Config } from "../config/config";
import type { DownloadQueue } from "../download/queue";
import { SOURCE_LABELS, type SourceId } from "../library/types";
import { makeYoutube } from "./youtube";
import { makeSoundcloud } from "./soundcloud";
import { makeSpotify } from "./spotify/adapter";
import type { SourceAdapter } from "./types";

export interface SyncProgress {
  /** Human line for the status row, e.g. "Checking YouTube (@handle)…". */
  message: string;
}

export interface SyncResult {
  /** Sources that had a saved handle and were swept. */
  sourcesChecked: number;
  /** Tracks newly queued for download. */
  added: number;
  /** Tracks the sweep saw that the library already has. */
  alreadySaved: number;
  /** Per-source failures (bad handle, network); the sweep continues past them. */
  errors: string[];
  /**
   * True when the gather signal aborted the sweep (the user canceled the
   * queue), so an interrupted run is never reported as "up to date".
   */
  canceled: boolean;
}

/** The adapters for every source with a saved handle, in sidebar order. */
export function savedAdapters(
  config: Config,
): Array<{ source: SourceId; handle: string; adapter: SourceAdapter }> {
  const out: Array<{ source: SourceId; handle: string; adapter: SourceAdapter }> =
    [];
  if (config.youtubeHandle)
    out.push({
      source: "youtube",
      handle: config.youtubeHandle,
      adapter: makeYoutube(config.youtubeHandle),
    });
  if (config.soundcloudHandle)
    out.push({
      source: "soundcloud",
      handle: config.soundcloudHandle,
      adapter: makeSoundcloud(config.soundcloudHandle),
    });
  if (config.spotifyHandle)
    out.push({
      source: "spotify",
      handle: config.spotifyHandle,
      adapter: makeSpotify(config.spotifyHandle),
    });
  return out;
}

/**
 * Sweep every saved source: list its playlists, gather their tracks, and
 * enqueue everything new. Tracks the library already owns are skipped by the
 * queue's own dedupe, so re-running is always safe. One source failing (handle
 * gone, network) doesn't stop the others. The queue's gather signal aborts the
 * sweep the moment the user cancels the queue, so a canceled batch can't be
 * revived by playlists still streaming in.
 */
export async function syncSavedSources(
  config: Config,
  queue: DownloadQueue,
  onProgress?: (p: SyncProgress) => void,
): Promise<SyncResult> {
  const targets = savedAdapters(config);
  const result: SyncResult = {
    sourcesChecked: 0,
    added: 0,
    alreadySaved: 0,
    errors: [],
    canceled: false,
  };
  if (targets.length === 0) return result;

  const signal = queue.beginGather();
  for (const { source, handle, adapter } of targets) {
    if (signal.aborted) break;
    const label = SOURCE_LABELS[source];
    onProgress?.({ message: `Checking ${label} (@${handle})…` });
    try {
      const lists = await adapter.listPlaylists();
      result.sourcesChecked++;
      for (let i = 0; i < lists.length; i++) {
        if (signal.aborted) break;
        const pl = lists[i]!;
        onProgress?.({
          message: `${label}: reading "${pl.title}" (${i + 1}/${lists.length})…`,
        });
        try {
          const tracks = await adapter.listTracks(pl);
          if (signal.aborted) break;
          if (tracks.length === 0) continue;
          const r = queue.enqueue(
            tracks.map((t) => ({
              source: adapter.id,
              sourceLabel: adapter.label,
              track: t,
            })),
          );
          result.added += r.added;
          result.alreadySaved += r.alreadySaved;
        } catch (e) {
          result.errors.push(
            `${label} / ${pl.title}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    } catch (e) {
      result.errors.push(
        `${label}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  result.canceled = signal.aborted;
  return result;
}
