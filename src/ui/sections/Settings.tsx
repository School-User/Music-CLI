import { useEffect, useState, type ReactNode } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Box, Text, useInput } from "ink";
import { Select, Spinner } from "@inkjs/ui";
import { useStore } from "../store";
import { TextField } from "../components/TextField";
import { Header } from "../components/Header";
import { openPath } from "../../util/open-path";
import { wrapStep } from "../move";
import { displayPath, truncate } from "../../util/format";
import { persistableHandle } from "../../sources/persist-handle";
import { COOKIE_BROWSERS } from "../../ytdlp/args";
import {
  ACTION_LABELS,
  DEFAULT_KEYBINDS,
  PLAYER_ACTIONS,
  bindableKeyError,
  customBindCount,
  resolveKeybinds,
  type PlayerAction,
} from "../keybinds";
import { syncSavedSources, savedAdapters, type SyncResult } from "../../sources/sync";
import { COLOR, DEFAULT_THEME, ICON, applyTheme, themeNames } from "../theme";

type Mode =
  | "menu"
  | "youtube"
  | "soundcloud"
  | "spotify"
  | "cookies"
  | "keybinds"
  | "appearance"
  | "sync"
  | "wipe-all";

export function Settings() {
  const {
    config,
    setConfig,
    library,
    queue,
    region,
    setCaptureMode,
    setSection,
  } = useStore();
  const focused = region === "content";
  const [mode, setMode] = useState<Mode>("menu");
  const [cursor, setCursor] = useState(0);
  // Player keys page: list cursor, the action awaiting its new key, and the
  // last rejected bind (reserved key, collision) shown under the list.
  const [kbCursor, setKbCursor] = useState(0);
  const [capturing, setCapturing] = useState<PlayerAction | null>(null);
  const [kbError, setKbError] = useState<string | null>(null);
  // Download-new-songs page: the live status line while sweeping, and the
  // final tally once the sweep ends (null while it is still running).
  const [syncMsg, setSyncMsg] = useState("");
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const entries: {
    value: Mode | "open-folder";
    name: string;
    detail: string;
    set?: boolean;
    danger?: boolean;
  }[] = [
    {
      value: "youtube",
      name: "YouTube handle",
      detail: config.youtubeHandle ? `@${config.youtubeHandle}` : "not set",
      set: Boolean(config.youtubeHandle),
    },
    {
      value: "soundcloud",
      name: "SoundCloud handle",
      detail: config.soundcloudHandle
        ? `@${config.soundcloudHandle}`
        : "not set",
      set: Boolean(config.soundcloudHandle),
    },
    {
      value: "spotify",
      name: "Spotify handle",
      detail: config.spotifyHandle
        ? `@${config.spotifyHandle}`
        : "not set",
      set: Boolean(config.spotifyHandle),
    },
    {
      value: "cookies",
      name: "Browser cookies",
      detail: config.cookiesFromBrowser ?? "off",
      set: Boolean(config.cookiesFromBrowser),
    },
    {
      value: "keybinds",
      name: "Player keys",
      detail:
        customBindCount(config.keybinds) > 0
          ? `${customBindCount(config.keybinds)} custom`
          : "default",
      set: customBindCount(config.keybinds) > 0,
    },
    {
      value: "appearance",
      name: "Appearance",
      detail: config.theme ?? DEFAULT_THEME,
      set: Boolean(config.theme),
    },
    {
      value: "sync",
      name: "Download new songs",
      detail:
        savedAdapters(config).length > 0
          ? "Check saved sources now"
          : "no sources saved",
      set: savedAdapters(config).length > 0,
    },
    {
      value: "open-folder",
      name: "Music folder",
      detail: displayPath(config.libraryDir),
    },
    {
      value: "wipe-all",
      name: "Wipe all",
      detail: "Delete every download",
      danger: true,
    },
  ];

  function openSetting(v: Mode | "open-folder"): void {
    if (v === "open-folder") {
      // The folder may not exist yet (fresh install, edited path): create it
      // first so the file manager always lands somewhere real.
      void fs
        .mkdir(config.libraryDir, { recursive: true })
        .catch(() => {})
        .then(() => openPath(config.libraryDir));
      return;
    }
    setMode(v);
  }

  // Menu navigation (the sub-pages own the keyboard via their own handlers).
  useInput(
    (_input, key) => {
      if (key.upArrow) setCursor((c) => wrapStep(c, -1, entries.length));
      else if (key.downArrow)
        setCursor((c) => wrapStep(c, 1, entries.length));
      else if (key.return) openSetting(entries[cursor]!.value);
    },
    { isActive: focused && mode === "menu" },
  );

  // Any sub-page (not the menu) owns esc while open, so esc backs up exactly
  // one level instead of jumping to the sidebar. Text sub-pages take the whole
  // keyboard, and so does waiting for a new keybind (the pressed key must
  // rebind, not skip a song); the wipe page only claims space + esc, so a
  // stray space can't toggle the player mid-confirmation.
  const inSubPage = focused && mode !== "menu";
  const isTextPage =
    mode === "youtube" || mode === "soundcloud" || mode === "spotify";
  useEffect(() => {
    setCaptureMode(
      !inSubPage ? "none" : isTextPage || capturing ? "text" : "picker",
    );
    return () => setCaptureMode("none");
  }, [inSubPage, isTextPage, capturing, setCaptureMode]);

  useInput(
    (_input, key) => {
      if (key.escape) {
        setMode("menu");
        setKbError(null);
      }
    },
    // While a keybind capture is live, esc belongs to it (cancel the capture,
    // stay on the page), so this one-level-back handler steps aside.
    { isActive: inSubPage && !capturing },
  );

  // Player keys page: browse the action list.
  const keybinds = resolveKeybinds(config.keybinds);
  const kbRows = PLAYER_ACTIONS.length + 1; // + the reset-all row
  useInput(
    (_input, key) => {
      if (key.upArrow) setKbCursor((c) => wrapStep(c, -1, kbRows));
      else if (key.downArrow) setKbCursor((c) => wrapStep(c, 1, kbRows));
      else if (key.return) {
        setKbError(null);
        if (kbCursor === PLAYER_ACTIONS.length) {
          setConfig({ ...config, keybinds: undefined });
        } else {
          setCapturing(PLAYER_ACTIONS[kbCursor]!);
        }
      } else if (
        (key.backspace || key.delete) &&
        kbCursor < PLAYER_ACTIONS.length
      ) {
        const next = { ...config.keybinds };
        delete next[PLAYER_ACTIONS[kbCursor]!];
        setConfig({
          ...config,
          keybinds: Object.keys(next).length ? next : undefined,
        });
        setKbError(null);
      }
    },
    { isActive: focused && mode === "keybinds" && !capturing },
  );

  // Player keys page: the next keypress becomes the binding.
  useInput(
    (input, key) => {
      if (key.escape) {
        setCapturing(null);
        setKbError(null);
        return;
      }
      const err =
        key.return || key.tab || input.length !== 1
          ? "press a single character key (esc cancels)"
          : bindableKeyError(input);
      if (err) {
        setKbError(err);
        return;
      }
      const action = capturing!;
      const taken = PLAYER_ACTIONS.find(
        (a) => a !== action && keybinds[a].includes(input),
      );
      if (taken) {
        setKbError(`"${input}" already means ${ACTION_LABELS[taken]}`);
        return;
      }
      const next = { ...config.keybinds };
      // Binding a key back to its factory default just clears the override.
      if (DEFAULT_KEYBINDS[action].includes(input)) delete next[action];
      else next[action] = input;
      setConfig({
        ...config,
        keybinds: Object.keys(next).length ? next : undefined,
      });
      setCapturing(null);
      setKbError(null);
    },
    { isActive: focused && mode === "keybinds" && capturing !== null },
  );

  // Opening the sync page starts the sweep; it keeps running if the user
  // leaves (the queue owns the downloads by then, and its gather signal is
  // the cancel path), so only the status display is torn down here.
  useEffect(() => {
    if (mode !== "sync") return;
    let alive = true;
    setSyncResult(null);
    setSyncMsg("Checking saved sources…");
    void syncSavedSources(config, queue, (p) => {
      if (alive) setSyncMsg(p.message);
    }).then((r) => {
      if (alive) setSyncResult(r);
    });
    return () => {
      alive = false;
    };
    // Re-running on every config change would restart the sweep mid-flight;
    // the page snapshot of config/queue at open time is the right input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Sync page: ↵ jumps to the Download queue to watch the batch come in.
  useInput(
    (_input, key) => {
      if (key.return) setSection("download");
    },
    { isActive: focused && mode === "sync" },
  );

  // Every settings sub-page is rendered through frame(), so the back hint lives
  // here once and stays identical across pages. esc always goes back one level.
  function frame(title: string, node: ReactNode) {
    return (
      <Box flexDirection="column">
        <Header title={title} focused={focused} />
        <Box>{node}</Box>
        <Box marginTop={1}>
          <Text>
            <Text color={COLOR.alt}>esc</Text>
            <Text dimColor> Back</Text>
          </Text>
        </Box>
      </Box>
    );
  }

  function handleField(
    title: string,
    value: string | undefined,
    placeholder: string,
    save: (v: string | undefined) => void,
  ) {
    return frame(
      title,
      <Box flexDirection="column">
        <Box>
          <Text color={COLOR.accent}>{`${ICON.pointer} `}</Text>
          <TextField
            isDisabled={!focused}
            defaultValue={value ?? ""}
            placeholder={placeholder}
            onSubmit={(v) => {
              save(v.trim() || undefined);
              setMode("menu");
            }}
          />
        </Box>
      </Box>,
    );
  }

  function saveHandleField(
    source: "youtube" | "soundcloud" | "spotify",
    key: "youtubeHandle" | "soundcloudHandle" | "spotifyHandle",
    title: string,
    value: string | undefined,
  ) {
    return handleField(title, value, "@username", (v) => {
      const raw = v ?? "";
      const handle = persistableHandle(source, raw);
      if (handle !== undefined || !raw.trim()) {
        setConfig({ ...config, [key]: handle });
      }
    });
  }

  if (mode === "youtube") {
    return saveHandleField(
      "youtube",
      "youtubeHandle",
      "Your YouTube handle",
      config.youtubeHandle,
    );
  }

  if (mode === "soundcloud") {
    return saveHandleField(
      "soundcloud",
      "soundcloudHandle",
      "Your SoundCloud handle",
      config.soundcloudHandle,
    );
  }

  if (mode === "spotify") {
    return saveHandleField(
      "spotify",
      "spotifyHandle",
      "Your Spotify handle",
      config.spotifyHandle,
    );
  }

  if (mode === "cookies") {
    // Safari's cookie store is only readable on macOS; hide it elsewhere so
    // the picker never offers a browser yt-dlp cannot actually read.
    const browsers = COOKIE_BROWSERS.filter(
      (b) => b !== "safari" || process.platform === "darwin",
    );
    return frame(
      "Browser cookies",
      <Box flexDirection="column">
        <Box marginBottom={1} flexDirection="column">
          <Text dimColor>{`${ICON.dot} Downloads reuse the login from the browser you pick`}</Text>
          <Text dimColor>{`${ICON.dot} Unlocks premium quality (YouTube Premium, SoundCloud Go+)`}</Text>
          <Text dimColor>{`${ICON.dot} Without a paid account this changes nothing`}</Text>
          <Text dimColor>{`${ICON.dot} On Windows, close Chrome first: it locks its cookies while open`}</Text>
        </Box>
        <Select
          isDisabled={!focused}
          // A saved browser can be absent from the options (safari persisted
          // on a Mac, config copied elsewhere; or a hand-edited value): the
          // Select doesn't validate defaultValue, so fall back to "off"
          // rather than initializing to an option that isn't rendered.
          defaultValue={
            config.cookiesFromBrowser &&
            (browsers as readonly string[]).includes(config.cookiesFromBrowser)
              ? config.cookiesFromBrowser
              : "off"
          }
          options={[
            { label: "Off (logged out)", value: "off" },
            ...browsers.map((b) => ({
              label: b.charAt(0).toUpperCase() + b.slice(1),
              value: b,
            })),
          ]}
          onChange={(v) => {
            setConfig({
              ...config,
              cookiesFromBrowser: v === "off" ? undefined : v,
            });
            setMode("menu");
          }}
        />
      </Box>,
    );
  }

  if (mode === "keybinds") {
    const labelWidth = Math.max(
      ...PLAYER_ACTIONS.map((a) => ACTION_LABELS[a].length),
    );
    const onReset = kbCursor === PLAYER_ACTIONS.length;
    return frame(
      "Player keys",
      <Box flexDirection="column">
        <Box marginBottom={1} flexDirection="column">
          <Text dimColor>{`${ICON.dot} ↵ on an action, then press its new key`}</Text>
          <Text dimColor>{`${ICON.dot} backspace returns an action to its default`}</Text>
          <Text dimColor>{`${ICON.dot} space and ← → always work and can't be remapped`}</Text>
        </Box>
        {PLAYER_ACTIONS.map((action, i) => {
          const here = focused && i === kbCursor;
          const isCustom =
            keybinds[action].join(" ") !== DEFAULT_KEYBINDS[action].join(" ");
          const keyText =
            capturing === action
              ? "press a key… (esc cancels)"
              : keybinds[action].join(" ") || "unbound";
          return (
            <Box key={action}>
              <Text color={COLOR.accent}>{here ? `${ICON.pointer} ` : "  "}</Text>
              <Text bold={here} color={here ? COLOR.accent : undefined} dimColor={!here}>
                {ACTION_LABELS[action].padEnd(labelWidth)}
              </Text>
              <Text
                color={capturing === action || isCustom ? COLOR.alt : undefined}
                dimColor={capturing !== action && !isCustom}
              >
                {`   ${keyText}`}
              </Text>
            </Box>
          );
        })}
        <Box marginTop={1}>
          <Text color={COLOR.accent}>{focused && onReset ? `${ICON.pointer} ` : "  "}</Text>
          <Text
            bold={focused && onReset}
            color={focused && onReset ? COLOR.accent : undefined}
            dimColor={!(focused && onReset)}
          >
            Reset to defaults
          </Text>
        </Box>
        {kbError ? (
          <Box marginTop={1}>
            <Text color={COLOR.bad}>{kbError}</Text>
          </Box>
        ) : null}
      </Box>,
    );
  }

  if (mode === "appearance") {
    return frame(
      "Appearance",
      <Box flexDirection="column">
        <Box marginBottom={1} flexDirection="column">
          <Text dimColor>{`${ICON.dot} Pick a color theme; it applies instantly`}</Text>
          <Text>
            {"  "}
            <Text color={COLOR.accent}>accent</Text>{" "}
            <Text color={COLOR.alt}>keys</Text>{" "}
            <Text color={COLOR.good}>playing</Text>{" "}
            <Text color={COLOR.warn}>warn</Text>{" "}
            <Text color={COLOR.bad}>error</Text>
          </Text>
        </Box>
        <Select
          isDisabled={!focused}
          defaultValue={config.theme ?? DEFAULT_THEME}
          options={themeNames().map((n) => ({
            label: n === DEFAULT_THEME ? `${n} (default)` : n,
            value: n,
          }))}
          onChange={(v) => {
            applyTheme(v);
            setConfig({
              ...config,
              theme: v === DEFAULT_THEME ? undefined : v,
            });
            setMode("menu");
          }}
        />
      </Box>,
    );
  }

  if (mode === "sync") {
    const noSources = savedAdapters(config).length === 0;
    return frame(
      "Download new songs",
      <Box flexDirection="column">
        {noSources ? (
          <Text dimColor>
            {`${ICON.dot} No sources saved yet — add a handle above, or use the Download section`}
          </Text>
        ) : syncResult === null ? (
          <Box>
            <Spinner label={` ${syncMsg}`} />
          </Box>
        ) : (
          <Box flexDirection="column">
            <Text>
              <Text color={COLOR.good}>{ICON.done} </Text>
              {syncResult.added > 0
                ? `Queued ${syncResult.added} new song${syncResult.added === 1 ? "" : "s"}`
                : "You're up to date, nothing new to download"}
            </Text>
            {syncResult.alreadySaved > 0 ? (
              <Text dimColor>{`${ICON.dot} ${syncResult.alreadySaved} already in your library`}</Text>
            ) : null}
            {syncResult.errors.length > 0 ? (
              <Text color={COLOR.warn}>
                {`${ICON.warn} ${syncResult.errors.length} list${syncResult.errors.length === 1 ? "" : "s"} couldn't be checked`}
              </Text>
            ) : null}
            {syncResult.added > 0 ? (
              <Box marginTop={1}>
                <Text>
                  <Text color={COLOR.alt}>↵</Text>
                  <Text dimColor> Watch the downloads</Text>
                </Text>
              </Box>
            ) : null}
          </Box>
        )}
      </Box>,
    );
  }

  if (mode === "wipe-all") {
    return frame(
      "Wipe all songs?",
      <Box flexDirection="column">
        <Box marginBottom={1} flexDirection="column">
          <Text dimColor>{`${ICON.dot} Delete every downloaded file`}</Text>
          <Text dimColor>{`${ICON.dot} Clear the library`}</Text>
          <Text dimColor>{`${ICON.dot} Empty the download queue`}</Text>
          <Text dimColor>{`${ICON.dot} Keep your handles & folder`}</Text>
        </Box>
        <Select
          isDisabled={!focused}
          options={[
            { label: "‹ Cancel", value: "cancel" },
            { label: "Yes, wipe everything", value: "confirm" },
          ]}
          onChange={(v) => {
            if (v !== "confirm") {
              setMode("menu");
              return;
            }
            void (async () => {
              // Stop downloads first so nothing is mid-write while we delete.
              queue.clearAll();
              const tracked = library.all().map((t) => t.filePath);
              await library.clear();
              // Remove the folders Music CLI creates (catches completed files,
              // .part partials, orphans, and empty dirs), plus any tracked files
              // that live outside the current music folder (e.g. an old folder).
              const targets = [
                ...["YouTube", "SoundCloud", "Spotify", "Links"].map((s) =>
                  path.join(config.libraryDir, s),
                ),
                ...tracked,
              ];
              await Promise.all(
                targets.map((p) =>
                  fs.rm(p, { recursive: true, force: true }).catch(() => {}),
                ),
              );
              setMode("menu");
            })();
          }}
        />
      </Box>,
    );
  }

  // Label column + inline detail (same rhythm as Download source rows), not
  // edge-pinned with flex — that leaves an ugly dead zone in wide terminals.
  const nameWidth = Math.max(...entries.map((e) => e.name.length));
  const DETAIL_MAX = 48;

  return (
    <Box flexDirection="column">
      <Header title="Settings" focused={focused} />
      <Box flexDirection="column">
        {entries.map((it, i) => {
          const here = i === cursor && focused;
          const active = here && focused;
          const detailColor =
            it.danger ? COLOR.bad : it.set ? COLOR.alt : undefined;
          return (
            <Box key={it.value} marginTop={it.danger ? 1 : 0}>
              <Text color={COLOR.accent}>
                {active ? `${ICON.pointer} ` : "  "}
              </Text>
              <Text
                color={
                  it.danger ? COLOR.bad : active ? COLOR.accent : undefined
                }
                bold={active}
                dimColor={!active && !it.danger}
              >
                {it.name.padEnd(nameWidth)}
              </Text>
              <Text
                color={detailColor}
                dimColor={!it.set && !it.danger}
              >
                {`   ${truncate(it.detail, DETAIL_MAX)}`}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
