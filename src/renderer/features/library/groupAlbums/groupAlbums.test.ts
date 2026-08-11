import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { groupAlbums } from "./groupAlbums";

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
    durationMs: 1000,
    bpm: null,
    rating: null,
    pictureId: null,
    picturePath: null,
    addedAt: "",
    updatedAt: "",
    ...patch,
  }) as Music;

it("groups by (albumArtist ?? artist, album) so same-named albums never fuse", () => {
  const groups = groupAlbums([
    music({ album: "Greatest Hits", albumArtist: "Alpha" }),
    music({ album: "Greatest Hits", albumArtist: "Beta" }),
  ]);
  expect(groups).toHaveLength(2);
});

it("falls back to artist when albumArtist is empty", () => {
  const groups = groupAlbums([
    music({ album: "X", albumArtist: "", artist: "Solo" }),
  ]);
  expect(groups[0]?.artist).toBe("Solo");
});

it("orders albums by year ascending with unknown years last", () => {
  const groups = groupAlbums([
    music({ album: "Unknown", year: null }),
    music({ album: "New", year: 2005 }),
    music({ album: "Old", year: 1999 }),
  ]);
  expect(groups.map((g) => g.album)).toEqual(["Old", "New", "Unknown"]);
});

it("sorts tracks by disc then track and splits discs", () => {
  const groups = groupAlbums([
    music({ album: "A", disc: 2, track: 1, title: "d2t1" }),
    music({ album: "A", disc: 1, track: 2, title: "d1t2" }),
    music({ album: "A", disc: 1, track: 1, title: "d1t1" }),
  ]);
  const group = groups[0];
  expect(group?.discs.map((d) => d.disc)).toEqual([1, 2]);
  expect(group?.discs[0]?.musics.map((m) => m.title)).toEqual(["d1t1", "d1t2"]);
  expect(group?.discs[1]?.musics.map((m) => m.title)).toEqual(["d2t1"]);
});

it("derives representative year, genre, artwork, and totals", () => {
  const groups = groupAlbums([
    music({ album: "A", year: 2001, genre: "", durationMs: 100 }),
    music({
      album: "A",
      year: 1999,
      genre: "Rock",
      durationMs: 200,
      picturePath: "/img/a.jpg",
    }),
  ]);
  expect(groups[0]).toMatchObject({
    year: 1999,
    genre: "Rock",
    musicCount: 2,
    totalDurationMs: 300,
    picturePath: "/img/a.jpg",
  });
});

it("does not collide keys across the albumArtist / album boundary", () => {
  const groups = groupAlbums([
    music({ albumArtist: "A B", album: "C" }),
    music({ albumArtist: "A", album: "B C" }),
  ]);
  expect(groups).toHaveLength(2);
});
