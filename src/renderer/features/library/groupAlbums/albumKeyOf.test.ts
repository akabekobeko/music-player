import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { albumKeyOf } from "./albumKeyOf";

const music = (fields: Partial<Music>): Music => fields as Music;

it("joins the album artist and the album with a NUL separator", () => {
  expect(
    albumKeyOf(music({ artist: "Solo", albumArtist: "Band", album: "Live" })),
  ).toBe("Band\u0000Live");
});

it("falls back to the track artist when the album artist is empty", () => {
  expect(
    albumKeyOf(music({ artist: "Solo", albumArtist: "", album: "Live" })),
  ).toBe("Solo\u0000Live");
});
