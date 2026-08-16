import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { MusicInfoStore } from "./musicInfoStore";

const MUSIC: Music = {
  id: 1,
  filePath: "/m/1.mp3",
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
};

it("opens with the given track and notifies subscribers", () => {
  const store = new MusicInfoStore();
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });

  store.open(MUSIC);
  expect(store.getSnapshot()).toBe(MUSIC);
  expect(notified).toBe(1);
});

it("close clears the track", () => {
  const store = new MusicInfoStore();
  store.open(MUSIC);
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
  store.open(MUSIC);
  expect(notified).toBe(0);
});
