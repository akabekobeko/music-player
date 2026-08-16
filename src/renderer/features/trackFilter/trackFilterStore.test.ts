import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TrackFilterStore } from "./trackFilterStore";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("starts with empty texts everywhere", () => {
  const store = new TrackFilterStore();
  expect(store.getSnapshot()).toEqual({
    draft: { artists: "", albums: "", playlists: "" },
    applied: { artists: "", albums: "", playlists: "" },
  });
});

it("updates the draft immediately and the applied value after the debounce", () => {
  const store = new TrackFilterStore();
  store.setText("artists", "rain");
  expect(store.getSnapshot().draft.artists).toBe("rain");
  expect(store.getSnapshot().applied.artists).toBe("");
  vi.runAllTimers();
  expect(store.getSnapshot().applied.artists).toBe("rain");
});

it("keeps sections independent", () => {
  const store = new TrackFilterStore();
  store.setText("albums", "love");
  vi.runAllTimers();
  const { draft, applied } = store.getSnapshot();
  expect(draft.artists).toBe("");
  expect(draft.playlists).toBe("");
  expect(applied.albums).toBe("love");
});

it("applies only the latest draft when typing continues", () => {
  const store = new TrackFilterStore();
  store.setText("playlists", "a");
  store.setText("playlists", "ab");
  vi.runAllTimers();
  expect(store.getSnapshot().applied.playlists).toBe("ab");
});

it("notifies listeners on draft and applied changes", () => {
  const store = new TrackFilterStore();
  const listener = vi.fn();
  store.subscribe(listener);
  store.setText("artists", "x");
  expect(listener).toHaveBeenCalledTimes(1);
  vi.runAllTimers();
  expect(listener).toHaveBeenCalledTimes(2);
});
