import { expect, it } from "vitest";
import { AlbumInfoStore, type AlbumInfoTarget } from "./albumInfoStore";

const ALBUM: AlbumInfoTarget = {
  album: "Album",
  artist: "Artist",
  year: 2000,
  genre: "Rock",
  musicCount: 10,
  totalDurationMs: 60000,
  picturePath: null,
};

it("opens with the given album and notifies subscribers", () => {
  const store = new AlbumInfoStore();
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });

  store.open(ALBUM);
  expect(store.getSnapshot()).toBe(ALBUM);
  expect(notified).toBe(1);
});

it("close clears the album", () => {
  const store = new AlbumInfoStore();
  store.open(ALBUM);
  store.close();
  expect(store.getSnapshot()).toBeNull();
});

it("unsubscribing stops notifications", () => {
  const store = new AlbumInfoStore();
  let notified = 0;
  const unsubscribe = store.subscribe(() => {
    notified += 1;
  });
  unsubscribe();
  store.open(ALBUM);
  expect(notified).toBe(0);
});
