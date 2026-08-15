import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { metadataInitOf } from "./metadataInitOf";

const music = (patch: Partial<Music> = {}): Music =>
  ({
    id: 1,
    filePath: "/m/a.mp3",
    audioFormat: "mp3",
    title: "Song",
    artist: "Artist",
    albumArtist: "",
    album: "Album",
    disc: 1,
    track: 1,
    year: null,
    genre: "",
    composer: "",
    lyricist: "",
    producer: "",
    conductor: "",
    publisher: "",
    durationMs: 1000,
    bpm: null,
    rating: null,
    pictureId: null,
    picturePath: null,
    addedAt: "",
    updatedAt: "",
    ...patch,
  }) as Music;

it("builds metadata with title / artist / album", () => {
  expect(metadataInitOf(music())).toEqual({
    title: "Song",
    artist: "Artist",
    album: "Album",
    artwork: [],
  });
});

it("uses the media-file URL for the artwork", () => {
  const init = metadataInitOf(music({ picturePath: "/images/a b.jpg" }));
  expect(init?.artwork).toEqual([{ src: "media-file:///images/a%20b.jpg" }]);
});

it("returns null to clear the metadata", () => {
  expect(metadataInitOf(null)).toBeNull();
});
