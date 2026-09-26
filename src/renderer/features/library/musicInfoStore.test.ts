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
  expect(store.getSnapshot()?.musics).toBe(musics);
  expect(notified).toBe(1);
});

it("opens without neighbours when no list is given", () => {
  const store = new MusicInfoStore();
  store.open([music(1)]);
  expect(store.getSnapshot()).toEqual({
    musics: [music(1)],
    previous: null,
    next: null,
  });
});

it("opens a single track with its neighbours in the given list", () => {
  const store = new MusicInfoStore();
  const siblings = [music(1), music(2), music(3)];
  store.open([music(2)], siblings);
  expect(store.getSnapshot()).toEqual({
    musics: [music(2)],
    previous: music(1),
    next: music(3),
  });
});

it("has no neighbours for a multi-track selection", () => {
  const store = new MusicInfoStore();
  const siblings = [music(1), music(2), music(3)];
  store.open([music(1), music(2)], siblings);
  expect(store.getSnapshot()?.previous).toBeNull();
  expect(store.getSnapshot()?.next).toBeNull();
});

it("previous / next step through the list and notify subscribers", () => {
  const store = new MusicInfoStore();
  const siblings = [music(1), music(2), music(3)];
  store.open([music(1)], siblings);
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });

  store.next();
  expect(store.getSnapshot()).toEqual({
    musics: [music(2)],
    previous: music(1),
    next: music(3),
  });
  store.next();
  expect(store.getSnapshot()?.musics).toEqual([music(3)]);
  expect(store.getSnapshot()?.next).toBeNull();
  store.previous();
  expect(store.getSnapshot()?.musics).toEqual([music(2)]);
  expect(notified).toBe(3);
});

it("ignores a step past either end of the list", () => {
  const store = new MusicInfoStore();
  store.open([music(1)], [music(1)]);
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });

  store.previous();
  store.next();
  expect(store.getSnapshot()?.musics).toEqual([music(1)]);
  expect(notified).toBe(0);
});

it("counts a track listed twice once when stepping", () => {
  const store = new MusicInfoStore();
  store.open([music(1)], [music(1), music(2), music(1), music(3)]);
  store.next();
  store.next();
  expect(store.getSnapshot()?.musics).toEqual([music(3)]);
  expect(store.getSnapshot()?.next).toBeNull();
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

it("an empty list leaves an open dialog and its neighbours untouched", () => {
  const store = new MusicInfoStore();
  store.open([music(2)], [music(1), music(2), music(3)]);
  store.open([]);
  expect(store.getSnapshot()?.previous).toEqual(music(1));
  store.next();
  expect(store.getSnapshot()?.musics).toEqual([music(3)]);
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

it("notifies onApplied listeners with the applied update", () => {
  const store = new MusicInfoStore();
  const received: unknown[] = [];
  store.onApplied((update) => {
    received.push(update);
  });

  const update = {
    targets: [music(1)],
    updated: [{ music: music(1), displayArtist: "Artist", albumKey: "k" }],
  };
  store.notifyApplied(update);
  expect(received).toEqual([update]);
});

it("skips the onApplied notification when nothing was updated", () => {
  const store = new MusicInfoStore();
  let notified = 0;
  store.onApplied(() => {
    notified += 1;
  });
  store.notifyApplied({ targets: [music(1)], updated: [] });
  expect(notified).toBe(0);
});

it("unsubscribing from onApplied stops notifications", () => {
  const store = new MusicInfoStore();
  let notified = 0;
  const unsubscribe = store.onApplied(() => {
    notified += 1;
  });
  unsubscribe();
  store.notifyApplied({
    targets: [music(1)],
    updated: [{ music: music(1), displayArtist: "Artist", albumKey: "k" }],
  });
  expect(notified).toBe(0);
});
