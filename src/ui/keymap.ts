// Single source of truth for keyboard shortcuts. The footer shows a tiny
// context-relevant subset; the `?` overlay shows everything. Defining them once
// here means the quick hint and the full cheatsheet can never drift apart, and
// the UI never has to dump a wall of commands at the user.

import type { PlaylistsDepth, Region, Section } from "./store";
import type { Keybinds } from "./keybinds";

export interface Hint {
  keys: string;
  label: string;
}

export interface HelpGroup {
  title: string;
  hints: Hint[];
}

/** Sidebar sections in display order, so digit keys can jump straight to one. */
const SECTION_ORDER: Section[] = [
  "library",
  "playlists",
  "history",
  "download",
  "settings",
];

/** Map "1".."5" to its section (the sidebar's display order); null otherwise. */
export function sectionForDigit(input: string): Section | null {
  if (!/^[1-5]$/.test(input)) return null;
  return SECTION_ORDER[Number(input) - 1] ?? null;
}

/** Join the parts of a key chord, skipping actions left unbound. */
function chord(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ") || "—";
}

/**
 * The full cheatsheet, shown in the `?` overlay, grouped by intent. Player
 * letters come from the resolved keybinds, so a remapped key shows its real
 * binding; space and the arrows are structural and always listed.
 */
export function helpGroups(kb: Keybinds): HelpGroup[] {
  return [
    {
      title: "Navigate",
      hints: [
        { keys: "↑ ↓", label: "Move" },
        { keys: "PgUp PgDn", label: "Jump a page" },
        { keys: "↵", label: "Open / play" },
        { keys: "1-5", label: "Jump section" },
        { keys: "/", label: "Search" },
        { keys: "d", label: "Delete" },
        { keys: "t", label: "Rename" },
        { keys: "tab", label: "Switch pane" },
        { keys: "esc", label: "Back" },
        { keys: "q", label: "Quit" },
      ],
    },
    {
      title: "Player",
      hints: [
        { keys: chord("space", kb.playPause[0]), label: "Play / pause" },
        {
          keys: chord("← →", kb.seekBack[0], kb.seekForward[0]),
          label: "Seek 15s",
        },
        {
          keys: chord(kb.seekBackSmall[0], kb.seekForwardSmall[0]),
          label: "Seek 5s",
        },
        { keys: chord(kb.restart[0]), label: "Restart song" },
        { keys: chord(kb.next[0], kb.prev[0]), label: "Next / prev" },
        { keys: chord(kb.repeat[0]), label: "Repeat" },
        { keys: chord(kb.shuffle[0]), label: "Shuffle" },
        { keys: chord(kb.volumeUp[0], kb.volumeDown[0]), label: "Volume" },
      ],
    },
    {
      title: "Downloads",
      hints: [
        { keys: "[ ]", label: "Pause / resume all" },
        { keys: "c", label: "Cancel all" },
        { keys: "↵", label: "Dismiss done" },
        { keys: "f", label: "Retry failed" },
        { keys: "space", label: "Pick: toggle row" },
      ],
    },
  ];
}

const ALWAYS: Hint = { keys: "?", label: "Keys" };
// tab is the one movement key the arrows can't cover (they belong to lists
// and seeking), so every footer variant advertises it under the same name.
const PANE: Hint = { keys: "tab", label: "Pane" };

/**
 * The handful of hints worth showing inline for the current focus. Always ends
 * with "? Keys" so the full set is one keystroke away without crowding the bar.
 */
export function footerHints(
  region: Region,
  section: Section,
  playlistsDepth: PlaylistsDepth = "sets",
): Hint[] {
  if (region === "sidebar") {
    return [
      { keys: "↑↓", label: "Move" },
      { keys: "↵", label: "Open" },
      PANE,
      ALWAYS,
      { keys: "q", label: "Quit" },
    ];
  }
  // In content, esc only mirrors tab (back to the sidebar), so the hint slot
  // goes to tab; esc appears only where it means something else (songs depth).
  switch (section) {
    case "settings":
      return [
        { keys: "↵", label: "Choose" },
        PANE,
        ALWAYS,
      ];
    case "download":
      // Download explains ↵ contextually in-section (choose / pause-resume), so
      // the footer stays neutral and never contradicts the in-list legend.
      return [
        PANE,
        ALWAYS,
      ];
    case "playlists":
      if (playlistsDepth === "songs") {
        return [
          { keys: "↵", label: "Play" },
          { keys: "/", label: "Search" },
          { keys: "d", label: "Delete" },
          { keys: "t", label: "Rename" },
          { keys: "esc", label: "Back" },
          PANE,
          ALWAYS,
        ];
      }
      return [
        { keys: "↵", label: "Open" },
        { keys: "/", label: "Search" },
        { keys: "[ ]", label: "Source" },
        { keys: "d", label: "Delete" },
        { keys: "t", label: "Rename" },
        PANE,
        ALWAYS,
      ];
    case "history":
      return [
        { keys: "↵", label: "Play" },
        { keys: "/", label: "Search" },
        { keys: "[ ]", label: "Source" },
        { keys: "d", label: "Delete" },
        PANE,
        ALWAYS,
      ];
    case "library":
      return [
        { keys: "↵", label: "Play" },
        { keys: "/", label: "Search" },
        { keys: "[ ]", label: "Source" },
        { keys: "d", label: "Delete" },
        { keys: "t", label: "Rename" },
        PANE,
        ALWAYS,
      ];
  }
}
