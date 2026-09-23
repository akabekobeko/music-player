import type { Music, UpdatedMusic } from "@mp/ipc";
import { expect, it } from "vitest";
import { nextAlbumKeyOf } from "./nextAlbumKeyOf";

const music = (id: number, album = "Album"): Music =>
  ({
    id,
    filePath: `/m/${id}.mp3`,
    audioFormat: "mp3",
    title: `Track ${id}`,
    artist: "A",
    albumArtist: "",
    album,
    disc: 1,
    track: id,
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
  }) as Music;

const key = (album: string): string => `A\u0000${album}`;

const updated = (id: number, album: string): UpdatedMusic => ({
  music: music(id, album),
  displayArtist: "A",
  albumKey: key(album),
});

it("keeps the key when none of the selected album's tracks was updated", () => {
  expect(
    nextAlbumKeyOf(key("Album"), [music(9, "Other")], [updated(9, "New")]),
  ).toBe(key("Album"));
  expect(nextAlbumKeyOf(key("Album"), [], [])).toBe(key("Album"));
});

it("follows the one new album key", () => {
  expect(
    nextAlbumKeyOf(
      key("Album"),
      [music(1), music(2)],
      [updated(1, "New"), updated(2, "New")],
    ),
  ).toBe(key("New"));
});

it("keeps the key when the tracks split across albums", () => {
  expect(
    nextAlbumKeyOf(
      key("Album"),
      [music(1), music(2)],
      [updated(1, "New"), updated(2, "Other")],
    ),
  ).toBe(key("Album"));
});

it("ignores updated tracks that belonged to another album", () => {
  expect(
    nextAlbumKeyOf(
      key("Album"),
      [music(1), music(2, "Other")],
      [updated(1, "New"), updated(2, "Elsewhere")],
    ),
  ).toBe(key("New"));
});
