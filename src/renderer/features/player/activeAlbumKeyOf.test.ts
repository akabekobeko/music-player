import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { activeAlbumKeyOf } from "./activeAlbumKeyOf";

const music = { artist: "Solo", albumArtist: "Band", album: "Live" } as Music;

it("returns the current track's album key while playing", () => {
  expect(activeAlbumKeyOf(music, "playing")).toBe("Band\u0000Live");
});

it("returns the current track's album key while loading", () => {
  expect(activeAlbumKeyOf(music, "loading")).toBe("Band\u0000Live");
});

it("returns the current track's album key while paused", () => {
  expect(activeAlbumKeyOf(music, "paused")).toBe("Band\u0000Live");
});

it("returns null when stopped", () => {
  expect(activeAlbumKeyOf(music, "stopped")).toBeNull();
});

it("returns null on error", () => {
  expect(activeAlbumKeyOf(music, "error")).toBeNull();
});

it("returns null without a current track", () => {
  expect(activeAlbumKeyOf(null, "playing")).toBeNull();
});
