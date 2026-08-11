import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { flattenAlbumMusics } from "./flattenAlbumMusics";
import { groupAlbums } from "./groupAlbums/groupAlbums";

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

it("flattens albums → disc → track into the play order", () => {
  const flat = flattenAlbumMusics(
    groupAlbums([
      music({ album: "New", year: 2005, track: 1, title: "n1" }),
      music({ album: "Old", year: 1999, disc: 2, track: 1, title: "o-d2" }),
      music({ album: "Old", year: 1999, disc: 1, track: 1, title: "o-d1" }),
    ]),
  );
  expect(flat.map((m) => m.title)).toEqual(["o-d1", "o-d2", "n1"]);
});
