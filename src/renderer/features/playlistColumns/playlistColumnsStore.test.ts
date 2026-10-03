import { expect, it, vi } from "vitest";
import { DEFAULT_PLAYLIST_COLUMNS_STATE } from "./constants";
import { PlaylistColumnsStore } from "./playlistColumnsStore";

it("starts with the default layout", () => {
  const store = new PlaylistColumnsStore(vi.fn());
  expect(store.getSnapshot()).toBe(DEFAULT_PLAYLIST_COLUMNS_STATE);
});

it("applies an action, saves the result, and notifies listeners", () => {
  const save = vi.fn();
  const listener = vi.fn();
  const store = new PlaylistColumnsStore(save);
  store.subscribe(listener);
  store.dispatch({
    type: "visibilityChanged",
    columnId: "year",
    visible: true,
  });
  expect(store.getSnapshot().visibleIds).toContain("year");
  expect(save).toHaveBeenCalledExactlyOnceWith(store.getSnapshot());
  expect(listener).toHaveBeenCalledTimes(1);
});

it("neither saves nor notifies an action that changes nothing", () => {
  const save = vi.fn();
  const listener = vi.fn();
  const store = new PlaylistColumnsStore(save);
  store.subscribe(listener);
  store.dispatch({
    type: "visibilityChanged",
    columnId: "title",
    visible: false,
  });
  store.dispatch({ type: "widthReset", columnId: "artist" });
  expect(save).not.toHaveBeenCalled();
  expect(listener).not.toHaveBeenCalled();
});

it("stops notifying after unsubscribe", () => {
  const store = new PlaylistColumnsStore(vi.fn());
  const listener = vi.fn();
  const unsubscribe = store.subscribe(listener);
  store.dispatch({ type: "widthChanged", columnId: "title", width: 400 });
  unsubscribe();
  store.dispatch({ type: "widthChanged", columnId: "title", width: 500 });
  expect(listener).toHaveBeenCalledTimes(1);
});

it("returns to the default layout on reset", () => {
  const store = new PlaylistColumnsStore(vi.fn());
  store.dispatch({ type: "widthChanged", columnId: "title", width: 400 });
  store.dispatch({
    type: "visibilityChanged",
    columnId: "album",
    visible: false,
  });
  store.dispatch({ type: "reset" });
  expect(store.getSnapshot()).toBe(DEFAULT_PLAYLIST_COLUMNS_STATE);
});

it("initializes from persisted settings without saving back", () => {
  const save = vi.fn();
  const listener = vi.fn();
  const store = new PlaylistColumnsStore(save);
  store.subscribe(listener);
  store.initialize({ visibleIds: ["year"], widths: { title: 400 } });
  expect(store.getSnapshot()).toEqual({
    visibleIds: ["year"],
    widths: { title: 400 },
  });
  expect(save).not.toHaveBeenCalled();
  expect(listener).not.toHaveBeenCalled();
});

it("keeps the default layout when no settings were persisted", () => {
  const save = vi.fn();
  const store = new PlaylistColumnsStore(save);
  store.initialize(undefined);
  expect(store.getSnapshot()).toBe(DEFAULT_PLAYLIST_COLUMNS_STATE);
  expect(save).not.toHaveBeenCalled();
});

it("saves the whole layout on every change", () => {
  const save = vi.fn();
  const store = new PlaylistColumnsStore(save);
  store.initialize({ visibleIds: ["year"], widths: { title: 400 } });
  store.dispatch({ type: "widthChanged", columnId: "year", width: 96 });
  expect(save).toHaveBeenLastCalledWith({
    visibleIds: ["year"],
    widths: { title: 400, year: 96 },
  });
  store.dispatch({
    type: "visibilityChanged",
    columnId: "genre",
    visible: true,
  });
  expect(save).toHaveBeenLastCalledWith({
    visibleIds: ["year", "genre"],
    widths: { title: 400, year: 96 },
  });
  store.dispatch({ type: "reset" });
  expect(save).toHaveBeenLastCalledWith(DEFAULT_PLAYLIST_COLUMNS_STATE);
  expect(save).toHaveBeenCalledTimes(3);
});
