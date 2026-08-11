import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { groupAlbums } from "@/features/library/groupAlbums";
import { buildAlbumRows } from "./albumRows";

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

it("emits album → tracks without disc headings for single-disc albums", () => {
  const rows = buildAlbumRows(
    groupAlbums([
      music({ album: "A", track: 1 }),
      music({ album: "A", track: 2 }),
    ]),
  );
  expect(rows.map((r) => r.type)).toEqual(["album", "music", "music"]);
});

it("inserts a disc heading per disc for multi-disc albums", () => {
  const rows = buildAlbumRows(
    groupAlbums([
      music({ album: "A", disc: 1, track: 1 }),
      music({ album: "A", disc: 2, track: 1 }),
    ]),
  );
  expect(rows.map((r) => r.type)).toEqual([
    "album",
    "disc",
    "music",
    "disc",
    "music",
  ]);
});

it("keeps the album order across groups", () => {
  const rows = buildAlbumRows(
    groupAlbums([
      music({ album: "New", year: 2005 }),
      music({ album: "Old", year: 1999 }),
    ]),
  );
  const albums = rows.filter((r) => r.type === "album");
  expect(albums.map((r) => (r.type === "album" ? r.group.album : ""))).toEqual([
    "Old",
    "New",
  ]);
});
