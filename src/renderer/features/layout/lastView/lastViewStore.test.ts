import { expect, it, vi } from "vitest";
import { LastViewStore, recordVisit } from "./lastViewStore";

const current = {
  section: "albums",
  artist: "Queen",
  playlist: "p1",
} as const;

it("recordVisit replaces only the visited section's selection", () => {
  expect(
    recordVisit(current, { section: "playlists", playlist: "s2" }),
  ).toEqual({ section: "playlists", artist: "Queen", playlist: "s2" });
  expect(recordVisit(current, { section: "artists", artist: "" })).toEqual({
    section: "artists",
    artist: "",
    playlist: "p1",
  });
});

it("recordVisit clears the selection when the section root is visited", () => {
  expect(recordVisit(current, { section: "artists" })).toEqual({
    section: "artists",
    playlist: "p1",
  });
});

it("starts at the artists section and keeps the initialized view", () => {
  const store = new LastViewStore(vi.fn());
  expect(store.getSnapshot()).toEqual({ section: "artists" });
  store.initialize({ section: "playlists", playlist: "p3" });
  expect(store.getSnapshot()).toEqual({ section: "playlists", playlist: "p3" });
});

it("persists and notifies on a change, but not on a no-op visit", () => {
  const save = vi.fn();
  const listener = vi.fn();
  const store = new LastViewStore(save);
  store.subscribe(listener);

  store.record({ section: "artists", artist: "Queen" });
  expect(save).toHaveBeenCalledWith({ section: "artists", artist: "Queen" });
  expect(listener).toHaveBeenCalledTimes(1);

  store.record({ section: "artists", artist: "Queen" });
  expect(save).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledTimes(1);
});
