import { describe, it, expect } from "vitest";
import path from "node:path";
import { cookieArgs, outputTemplateInFolder } from "../src/ytdlp/args";

describe("outputTemplateInFolder", () => {
  it("places yt-dlp's filename inside the given folder without owner", () => {
    const p = outputTemplateInFolder(path.join("music"), "SoundCloud", "Liked Songs");
    expect(p).toBe(
      path.join(
        "music",
        "SoundCloud",
        "Liked Songs",
        "%(artist,uploader|Unknown Artist)s - %(track,title)s.%(ext)s",
      ),
    );
  });

  it("inserts the sanitized owner segment when provided", () => {
    const p = outputTemplateInFolder(path.join("music"), "YouTube", "Mix", "my/owner:name");
    expect(p).toBe(
      path.join(
        "music",
        "YouTube",
        "my_owner_name",
        "Mix",
        "%(artist,uploader|Unknown Artist)s - %(track,title)s.%(ext)s",
      ),
    );
  });

  it("sanitizes the folder name", () => {
    const p = outputTemplateInFolder(path.join("music"), "SoundCloud", "my/set:name");
    expect(p).toContain(path.join("music", "SoundCloud", "my_set_name"));
  });
});

describe("cookieArgs", () => {
  it("returns nothing when no browser is configured", () => {
    expect(cookieArgs(undefined)).toEqual([]);
    expect(cookieArgs("")).toEqual([]);
  });

  it("passes a known browser through to yt-dlp", () => {
    expect(cookieArgs("firefox")).toEqual([
      "--cookies-from-browser",
      "firefox",
    ]);
  });

  it("ignores a browser yt-dlp does not know (hand-edited config)", () => {
    expect(cookieArgs("netscape")).toEqual([]);
  });
});
