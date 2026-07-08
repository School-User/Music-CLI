import { describe, it, expect } from "vitest";
import {
  DEFAULT_KEYBINDS,
  PLAYER_ACTIONS,
  bindableKeyError,
  customBindCount,
  resolveKeybinds,
} from "../src/ui/keybinds";
import { helpGroups } from "../src/ui/keymap";

describe("bindableKeyError", () => {
  it("accepts plain printable characters", () => {
    expect(bindableKeyError("x")).toBeNull();
    expect(bindableKeyError("9")).toBeNull();
    expect(bindableKeyError(";")).toBeNull();
  });

  it("rejects reserved app keys", () => {
    for (const k of ["q", "?", "/", "d", "t", "c", "f", "[", "]", " ", "1", "5"]) {
      expect(bindableKeyError(k)).not.toBeNull();
    }
  });

  it("rejects chords, empties, and control characters", () => {
    expect(bindableKeyError("")).not.toBeNull();
    expect(bindableKeyError("ab")).not.toBeNull();
    expect(bindableKeyError("\x1b")).not.toBeNull();
    expect(bindableKeyError("\x7f")).not.toBeNull();
  });
});

describe("resolveKeybinds", () => {
  it("returns the defaults when nothing is customized", () => {
    const kb = resolveKeybinds();
    for (const action of PLAYER_ACTIONS) {
      expect(kb[action]).toEqual([...DEFAULT_KEYBINDS[action]]);
    }
  });

  it("applies a custom bind and keeps the rest on defaults", () => {
    const kb = resolveKeybinds({ next: "b" });
    expect(kb.next).toEqual(["b"]);
    expect(kb.prev).toEqual(["p"]);
  });

  it("ignores invalid and reserved keys from a hand-edited config", () => {
    const kb = resolveKeybinds({ next: "q", prev: "nope", repeat: "" });
    expect(kb.next).toEqual(["n"]);
    expect(kb.prev).toEqual(["p"]);
    expect(kb.repeat).toEqual(["r"]);
  });

  it("ignores unknown action names", () => {
    const kb = resolveKeybinds({ danceMode: "x" });
    for (const action of PLAYER_ACTIONS) {
      expect(kb[action]).toEqual([...DEFAULT_KEYBINDS[action]]);
    }
  });

  it("strips a stolen key from its default action so one key never fires twice", () => {
    // Bind next to shuffle's default "s": shuffle must not keep it.
    const kb = resolveKeybinds({ next: "s" });
    expect(kb.next).toEqual(["s"]);
    expect(kb.shuffle).toEqual([]);
  });

  it("keeps a surviving alias when a custom bind steals one of a pair", () => {
    const kb = resolveKeybinds({ next: "+" });
    expect(kb.next).toEqual(["+"]);
    expect(kb.volumeUp).toEqual(["="]);
  });

  it("gives a doubly-claimed key to the first action in display order", () => {
    const kb = resolveKeybinds({ playPause: "x", shuffle: "x" });
    expect(kb.playPause).toEqual(["x"]);
    expect(kb.shuffle).toEqual(["s"]);
  });
});

describe("customBindCount", () => {
  it("is zero for defaults and counts every action that changed", () => {
    expect(customBindCount()).toBe(0);
    expect(customBindCount({ next: "b" })).toBe(1);
    // Stealing shuffle's key changes both next and shuffle.
    expect(customBindCount({ next: "s" })).toBe(2);
  });
});

describe("helpGroups", () => {
  it("shows the remapped key in the Player column", () => {
    const groups = helpGroups(resolveKeybinds({ next: "b" }));
    const player = groups.find((g) => g.title === "Player")!;
    const nextPrev = player.hints.find((h) => h.label === "Next / prev")!;
    expect(nextPrev.keys).toBe("b p");
  });

  it("always lists the structural keys", () => {
    const player = helpGroups(resolveKeybinds()).find(
      (g) => g.title === "Player",
    )!;
    expect(player.hints[0]!.keys).toContain("space");
    expect(player.hints[1]!.keys).toContain("← →");
  });
});
