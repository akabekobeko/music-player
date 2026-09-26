import { expect, it } from "vitest";
import { groupMusicsByAlbum } from "./groupMusicsByAlbum";

const song = (
  id: number,
  artist: string,
  albumArtist: string,
  album: string,
) => ({
  id,
  artist,
  albumArtist,
  album,
});

it("groups by display artist and album, keeping first-appearance order", () => {
  const groups = groupMusicsByAlbum([
    song(1, "A", "", "X"),
    song(2, "B", "", "Y"),
    song(3, "A", "", "X"),
    song(4, "C", "A", "X"),
  ]);

  expect(groups.map((group) => group.map((music) => music.id))).toEqual([
    [1, 3, 4],
    [2],
  ]);
});

it("keeps ('A B', 'C') and ('A', 'B C') apart", () => {
  expect(
    groupMusicsByAlbum([song(1, "A B", "", "C"), song(2, "A", "", "B C")]),
  ).toHaveLength(2);
});

it("groups unknown-album songs of one artist together", () => {
  expect(
    groupMusicsByAlbum([song(1, "A", "", ""), song(2, "A", "", "")]),
  ).toHaveLength(1);
});

it("returns no groups for no songs", () => {
  expect(groupMusicsByAlbum([])).toEqual([]);
});
