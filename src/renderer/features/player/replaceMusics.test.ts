import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { replaceMusic, replaceMusics } from "./replaceMusics";

const music = (id: number, title = `Track ${id}`): Music =>
  ({
    id,
    filePath: `/m/${id}.mp3`,
    audioFormat: "mp3",
    title,
    artist: "Artist",
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

it("swaps the matching tracks in place and keeps the order", () => {
  const list = [music(1), music(2), music(3)];
  const edited = music(2, "Edited");
  const next = replaceMusics(list, [edited, music(9)]);
  expect(next.map((entry) => entry.id)).toEqual([1, 2, 3]);
  expect(next[1]).toBe(edited);
  expect(next[0]).toBe(list[0]);
  expect(next[2]).toBe(list[2]);
});

it("returns the same list when no track matches", () => {
  const list = [music(1), music(2)];
  expect(replaceMusics(list, [music(9)])).toBe(list);
  expect(replaceMusics(list, [])).toBe(list);
});

it("replaces every row of a track that appears more than once", () => {
  const list = [music(1), music(2), music(1)];
  const edited = music(1, "Edited");
  const next = replaceMusics(list, [edited]);
  expect(next[0]).toBe(edited);
  expect(next[2]).toBe(edited);
});

it("replaces the current track only when it was updated", () => {
  const current = music(1);
  const edited = music(1, "Edited");
  expect(replaceMusic(current, [edited])).toBe(edited);
  expect(replaceMusic(current, [music(2)])).toBe(current);
  expect(replaceMusic(null, [edited])).toBeNull();
});
