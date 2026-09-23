import type { Music, UpdatedMusic } from "@mp/ipc";
import { expect, it } from "vitest";
import { nextArtistRouteOf } from "./nextArtistRouteOf";

const music = (id: number): Music =>
  ({
    id,
    filePath: `/m/${id}.mp3`,
    audioFormat: "mp3",
    title: `Track ${id}`,
    artist: "A",
    albumArtist: "",
    album: "Album",
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

const updated = (id: number, displayArtist: string): UpdatedMusic => ({
  music: music(id),
  displayArtist,
  albumKey: `${displayArtist}\u0000Album`,
});

const shown = [music(1), music(2), music(3)];

it("stays when none of the shown tracks was updated", () => {
  expect(nextArtistRouteOf("A", shown, [updated(9, "B")])).toBeNull();
  expect(nextArtistRouteOf("A", shown, [])).toBeNull();
});

it("stays when the updated tracks still show the same artist", () => {
  expect(
    nextArtistRouteOf("A", shown, [updated(1, "A"), updated(2, "A")]),
  ).toBeNull();
});

it("follows the one new display artist", () => {
  expect(nextArtistRouteOf("A", shown, [updated(1, "B")])).toBe(
    "/artists/name/B",
  );
  expect(nextArtistRouteOf("A", shown, [updated(1, ""), updated(2, "")])).toBe(
    "/artists/unknown",
  );
});

it("stays when the tracks split across artists but some remain", () => {
  expect(
    nextArtistRouteOf("A", shown, [updated(1, "B"), updated(2, "C")]),
  ).toBeNull();
  expect(
    nextArtistRouteOf(
      "A",
      [music(1), music(2)],
      [updated(1, "B"), updated(2, "A")],
    ),
  ).toBeNull();
});

it("returns to the artist list when the tracks split and none remains", () => {
  expect(
    nextArtistRouteOf(
      "A",
      [music(1), music(2)],
      [updated(1, "B"), updated(2, "C")],
    ),
  ).toBe("/artists");
});
