import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { MusicInfoStore } from "./musicInfoStore";

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

it("opens with the given tracks and notifies subscribers", () => {
  const store = new MusicInfoStore();
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });

  const musics = [music(1), music(2)];
  store.open(musics);
  expect(store.getSnapshot()).toBe(musics);
  expect(notified).toBe(1);
});

it("ignores an empty list", () => {
  const store = new MusicInfoStore();
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });

  store.open([]);
  expect(store.getSnapshot()).toBeNull();
  expect(notified).toBe(0);
});

it("close clears the tracks", () => {
  const store = new MusicInfoStore();
  store.open([music(1)]);
  store.close();
  expect(store.getSnapshot()).toBeNull();
});

it("unsubscribing stops notifications", () => {
  const store = new MusicInfoStore();
  let notified = 0;
  const unsubscribe = store.subscribe(() => {
    notified += 1;
  });
  unsubscribe();
  store.open([music(1)]);
  expect(notified).toBe(0);
});
