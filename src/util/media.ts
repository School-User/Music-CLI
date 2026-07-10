import path from "node:path";

/**
 * Container extensions the video download mode produces. Kept deliberately
 * distinct from the audio set (which includes .webm, since audio downloads can
 * land as webm): a file with one of these extensions is a real video and must
 * open in the system player, not mpv — the terminal can't show video, and mpv
 * here runs audio-only (--no-video).
 */
export const VIDEO_EXTS = new Set([".mp4", ".mkv", ".mov", ".m4v", ".avi"]);

/** Whether a downloaded file is a video, so playback opens it externally. */
export function isVideoFile(filePath: string): boolean {
  return VIDEO_EXTS.has(path.extname(filePath).toLowerCase());
}
