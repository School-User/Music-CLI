import { describe, it, expect, afterEach } from "vitest";
import {
  COLOR,
  DEFAULT_THEME,
  THEMES,
  applyTheme,
  themeNames,
  accentRamp,
} from "../src/ui/theme";

afterEach(() => applyTheme());

describe("themes", () => {
  it("every theme fills every palette slot with a hex color", () => {
    for (const name of themeNames()) {
      for (const [slot, value] of Object.entries(THEMES[name]!)) {
        expect(value, `${name}.${slot}`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("applyTheme mutates the live palette in place", () => {
    const before = COLOR.accent;
    applyTheme("ocean");
    expect(COLOR.accent).toBe(THEMES.ocean!.accent);
    expect(COLOR.accent).not.toBe(before);
  });

  it("falls back to the default for unknown or missing names", () => {
    applyTheme("ocean");
    applyTheme("not-a-theme");
    expect(COLOR.accent).toBe(THEMES[DEFAULT_THEME]!.accent);
    applyTheme("ocean");
    applyTheme(undefined);
    expect(COLOR.accent).toBe(THEMES[DEFAULT_THEME]!.accent);
  });

  it("accentRamp follows the live palette", () => {
    applyTheme("violet");
    expect(accentRamp()).toEqual([
      THEMES.violet!.accent,
      THEMES.violet!.amber,
    ]);
  });
});
