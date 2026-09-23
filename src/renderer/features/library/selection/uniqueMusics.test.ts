import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { uniqueMusics } from "./uniqueMusics";

const music = (id: number): Music => ({
  id,
  filePath: `/m/${id}.mp3`,
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
});

it("keeps the first occurrence of each track in order", () => {
  const a = music(1);
  const b = music(2);
  expect(uniqueMusics([b, a, music(2), music(1), a])).toEqual([b, a]);
});

it("leaves a list without repeats as it is", () => {
  const musics = [music(1), music(2), music(3)];
  expect(uniqueMusics(musics)).toEqual(musics);
});
