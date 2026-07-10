import { describe, it, expect } from "vitest";
import { isVideoFile, VIDEO_EXTS } from "../src/util/media";
import { mediaFormatArgs } from "../src/ytdlp/args";

describe("isVideoFile", () => {
  it("recognizes video containers", () => {
    expect(isVideoFile("/m/Song.mp4")).toBe(true);
    expect(isVideoFile("/m/Clip.MKV")).toBe(true);
    expect(isVideoFile("a - b.mov")).toBe(true);
  });

  it("treats audio (including webm) as not video, so it stays in mpv", () => {
    expect(isVideoFile("/m/Song.opus")).toBe(false);
    expect(isVideoFile("/m/Song.m4a")).toBe(false);
    // .webm is an audio container here; must not be misread as video.
    expect(isVideoFile("/m/Song.webm")).toBe(false);
  });

  it("keeps the video and audio extension worlds disjoint", () => {
    expect(VIDEO_EXTS.has(".webm")).toBe(false);
  });
});

describe("mediaFormatArgs", () => {
  it("extracts audio by default", () => {
    expect(mediaFormatArgs()).toEqual(["-x"]);
    expect(mediaFormatArgs(false)).toEqual(["-x"]);
  });

  it("downloads merged video when video mode is on", () => {
    const args = mediaFormatArgs(true);
    expect(args).toContain("-f");
    expect(args).toContain("bv*+ba/b");
    expect(args).toContain("--merge-output-format");
    expect(args).toContain("mp4");
    expect(args).not.toContain("-x");
  });
});
