import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { groupAlbums } from "@/features/library/groupAlbums/groupAlbums";
import { albumRowIndexOf } from "./albumRowIndexOf";
import { buildAlbumRows } from "./buildAlbumRows";

let nextId = 1;
const music = (patch: Partial<Music>): Music =>
  ({
    id: nextId++,
    filePath: `/m/${nextId}.mp3`,
    audioFormat: "mp3",
    title: "T",
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

it("returns the heading row index of the album, skipping its tracks", () => {
  const groups = groupAlbums([
    music({ album: "A", year: 2000, track: 1 }),
    music({ album: "A", year: 2000, track: 2 }),
    music({ album: "B", year: 2001, track: 1 }),
  ]);
  const rows = buildAlbumRows(groups);
  const [first, second] = groups;
  if (first === undefined || second === undefined) {
    throw new Error("expected two album groups");
  }

  expect(albumRowIndexOf(rows, first.key)).toBe(0);
  // "A" heading, two tracks, then the "B" heading.
  expect(albumRowIndexOf(rows, second.key)).toBe(3);
});

it("returns -1 for an album that is not in the rows", () => {
  const rows = buildAlbumRows(groupAlbums([music({ album: "A" })]));
  expect(albumRowIndexOf(rows, "missing")).toBe(-1);
});
