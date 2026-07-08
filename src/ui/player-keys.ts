// Global player shortcuts. Handled in App before section-specific keys so
// transport stays live during downloads, queue scrolling, etc. The letters are
// remappable (Settings -> Player keys); space and the arrow keys are
// structural and always work.

import type { Playback } from "../player/playback";
import type { Track } from "../library/types";
import type { CaptureMode } from "./store";
import { shuffledOrder } from "../player/order";
import { resolveKeybinds, type Keybinds, type PlayerAction } from "./keybinds";

/** True when mpv (or equivalent) can seek / pause the current file. */
export function playerCanControl(playback: Playback): boolean {
  return Boolean(playback.getState().canControl);
}

/** Space always pauses; the letter (default k) is the remappable alias. */
export function isPauseKey(input: string, kb: Keybinds): boolean {
  return input === " " || kb.playPause.includes(input);
}

/** Transport actions gated on canControl (everything except play/pause). */
const TRANSPORT_ACTIONS: readonly PlayerAction[] = [
  "seekBack",
  "seekForward",
  "seekBackSmall",
  "seekForwardSmall",
  "restart",
  "next",
  "prev",
  "volumeUp",
  "volumeDown",
];

/** Whether this keypress is bound to a (non-pause) transport action. */
export function isTransportKey(
  input: string,
  key: { leftArrow?: boolean; rightArrow?: boolean } | undefined,
  kb: Keybinds,
): boolean {
  if (key?.leftArrow || key?.rightArrow) return true;
  return TRANSPORT_ACTIONS.some((a) => kb[a].includes(input));
}

/**
 * Handle play/pause, seek, skip, volume, restart. Returns true when the key
 * was a player-transport binding (even if mpv is momentarily busy).
 * Arrows always seek 15s (they are free everywhere except text fields, which
 * own captureMode "text"); the letters come from the resolved keybinds.
 */
export function handlePlayerTransport(
  playback: Playback,
  input: string,
  key?: { leftArrow?: boolean; rightArrow?: boolean },
  kb: Keybinds = resolveKeybinds(),
): boolean {
  if (isPauseKey(input, kb)) {
    void playback.togglePause();
    return true;
  }
  if (kb.seekBack.includes(input) || key?.leftArrow) {
    void playback.seek(-15);
    return true;
  }
  if (kb.seekForward.includes(input) || key?.rightArrow) {
    void playback.seek(15);
    return true;
  }
  if (kb.next.includes(input)) {
    void playback.next();
    return true;
  }
  if (kb.prev.includes(input)) {
    void playback.prev();
    return true;
  }
  if (kb.restart.includes(input)) {
    void playback.restart();
    return true;
  }
  if (kb.seekBackSmall.includes(input)) {
    void playback.seek(-5);
    return true;
  }
  if (kb.seekForwardSmall.includes(input)) {
    void playback.seek(5);
    return true;
  }
  if (kb.volumeUp.includes(input)) {
    void playback.changeVolume(5);
    return true;
  }
  if (kb.volumeDown.includes(input)) {
    void playback.changeVolume(-5);
    return true;
  }
  return false;
}

/** Repeat / shuffle and idle shuffle-start. Always safe to call. */
export function handlePlayerMode(
  playback: Playback,
  input: string,
  playTrack: (t: Track, list?: Track[]) => void,
  allTracks: Track[],
  kb: Keybinds = resolveKeybinds(),
): boolean {
  if (kb.repeat.includes(input)) {
    playback.cycleRepeat();
    return true;
  }
  if (kb.shuffle.includes(input)) {
    const st = playback.getState();
    if (st.track) {
      // A resumed session holds a single-track list; hand shuffle the whole
      // library to roam (audio untouched) before toggling it on.
      if (st.list.length <= 1 && allTracks.length > 1) {
        const at = allTracks.findIndex((t) => t.id === st.track!.id);
        if (at >= 0) playback.adoptList([...allTracks], at);
      }
      playback.toggleShuffle();
    } else if (allTracks.length > 0) {
      const shuffled = shuffledOrder(allTracks.length, -1).map((i) => allTracks[i]!);
      playTrack(shuffled[0]!, shuffled);
    }
    return true;
  }
  return false;
}

/** Space is owned by pickers; everything else here is player-only. */
export function shouldBlockPlayerSpace(captureMode: CaptureMode): boolean {
  return captureMode === "picker";
}
