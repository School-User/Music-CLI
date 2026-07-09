// Player keybinds: the remappable half of the keyboard. Structural keys stay
// fixed (space, arrows, tab, esc, enter, digits 1-5) along with the section
// keys (q ? / d t c f [ ]) — Ink runs every active useInput handler for a
// keypress, so the app relies on the player set never overlapping those.
// Everything here funnels through resolveKeybinds so the key handlers and the
// `?` cheatsheet can never disagree about what a key does.

/** Remappable player actions, in cheatsheet display order. */
export const PLAYER_ACTIONS = [
  "playPause",
  "seekBack",
  "seekForward",
  "seekBackSmall",
  "seekForwardSmall",
  "restart",
  "next",
  "prev",
  "repeat",
  "shuffle",
  "volumeUp",
  "volumeDown",
] as const;

export type PlayerAction = (typeof PLAYER_ACTIONS)[number];

export const ACTION_LABELS: Record<PlayerAction, string> = {
  playPause: "Play / pause",
  seekBack: "Seek back 15s",
  seekForward: "Seek forward 15s",
  seekBackSmall: "Seek back 5s",
  seekForwardSmall: "Seek forward 5s",
  restart: "Restart song",
  next: "Next song",
  prev: "Previous song",
  repeat: "Repeat",
  shuffle: "Shuffle",
  volumeUp: "Volume up",
  volumeDown: "Volume down",
};

/**
 * Factory-default keys. An action may ship aliases (+/= share a physical key
 * on most layouts); a custom bind always replaces the whole list.
 */
export const DEFAULT_KEYBINDS: Record<PlayerAction, readonly string[]> = {
  playPause: ["k"],
  seekBack: ["j"],
  seekForward: ["l"],
  seekBackSmall: [","],
  seekForwardSmall: ["."],
  restart: ["0"],
  next: ["n"],
  prev: ["p"],
  repeat: ["r"],
  shuffle: ["s"],
  volumeUp: ["+", "="],
  volumeDown: ["-", "_"],
};

/**
 * Keys the rest of the UI owns. Binding a player action to one of these would
 * make two handlers fire on the same keypress (quit while skipping, delete
 * while pausing), so they are rejected everywhere a bind can enter.
 */
export const RESERVED_KEYS: ReadonlySet<string> = new Set([
  " ", // play/pause + picker row toggle, always live
  "q", // quit
  "?", // cheatsheet
  "/", // search
  "d", // delete
  "t", // rename
  "c", // cancel downloads
  "f", // retry failed downloads
  "[", // source tab / pause all
  "]", // source tab / resume all
  "1",
  "2",
  "3",
  "4",
  "5", // section jumps
]);

/**
 * Why a key can't be bound, or null when it can. Named keys (arrows, tab,
 * enter, esc) never reach this as single characters, so length covers them.
 */
export function bindableKeyError(key: string): string | null {
  if (key.length !== 1) return "press a single character key";
  const code = key.charCodeAt(0);
  if (code < 33 || code === 127) return "that key can't be rebound";
  if (RESERVED_KEYS.has(key)) return "that key is reserved by the app";
  return null;
}

/** Resolved map the key handlers and cheatsheet consume. */
export type Keybinds = Record<PlayerAction, string[]>;

/**
 * Merge the user's custom binds (config `keybinds`, action -> key) over the
 * defaults. Hand-edited configs are untrusted: invalid keys are ignored, a key
 * claimed by two actions goes to the first in PLAYER_ACTIONS order, and a
 * default that a custom bind steals is dropped from its old action (falling
 * back to a surviving alias, or unbound) so one key can never fire twice.
 */
export function resolveKeybinds(custom?: Record<string, string>): Keybinds {
  const claimed = new Map<string, PlayerAction>();
  for (const action of PLAYER_ACTIONS) {
    const key = custom?.[action];
    if (
      typeof key === "string" &&
      !bindableKeyError(key) &&
      !claimed.has(key)
    ) {
      claimed.set(key, action);
    }
  }
  const out = {} as Keybinds;
  for (const action of PLAYER_ACTIONS) {
    const own = [...claimed].find(([, a]) => a === action)?.[0];
    out[action] = own
      ? [own]
      : DEFAULT_KEYBINDS[action].filter((k) => !claimed.has(k));
  }
  return out;
}

/** How many actions differ from factory defaults (the Settings row detail). */
export function customBindCount(custom?: Record<string, string>): number {
  const resolved = resolveKeybinds(custom);
  return PLAYER_ACTIONS.filter(
    (a) => resolved[a].join(" ") !== DEFAULT_KEYBINDS[a].join(" "),
  ).length;
}
