import { expect, it } from "vitest";
import { AlbumInfoStore, type AlbumInfoTarget } from "./albumInfoStore";

const ALBUM: AlbumInfoTarget = {
  key: "Artist\u0000Album",
  album: "Album",
  artist: "Artist",
  year: 2000,
  genre: "Rock",
  musicCount: 10,
  totalDurationMs: 60000,
  picturePath: null,
};

const albumOf = (key: string): AlbumInfoTarget => ({ ...ALBUM, key });

it("opens with the given album and notifies subscribers", () => {
  const store = new AlbumInfoStore();
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });

  store.open(ALBUM);
  expect(store.getSnapshot()).toEqual({
    album: ALBUM,
    previous: null,
    next: null,
  });
  expect(notified).toBe(1);
});

it("opens with its neighbours in the given list, matched by key", () => {
  const store = new AlbumInfoStore();
  const siblings = [albumOf("a"), albumOf("b"), albumOf("c")];
  store.open(albumOf("b"), siblings);
  expect(store.getSnapshot()).toEqual({
    album: albumOf("b"),
    previous: albumOf("a"),
    next: albumOf("c"),
  });
});

it("previous / next step through the list and stop at its ends", () => {
  const store = new AlbumInfoStore();
  const siblings = [albumOf("a"), albumOf("b")];
  store.open(albumOf("a"), siblings);
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });

  store.previous();
  expect(store.getSnapshot()?.album).toEqual(albumOf("a"));
  store.next();
  expect(store.getSnapshot()).toEqual({
    album: albumOf("b"),
    previous: albumOf("a"),
    next: null,
  });
  store.next();
  expect(store.getSnapshot()?.album).toEqual(albumOf("b"));
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
