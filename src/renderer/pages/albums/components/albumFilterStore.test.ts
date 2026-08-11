import type { AlbumFilter } from "@mp/ipc";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AlbumFilterStore } from "./albumFilterStore";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("updates the draft immediately and the applied filter after 200ms", () => {
  const store = new AlbumFilterStore(() => {});
  store.dispatch({ type: "genreToggled", genre: "Rock" });

  expect(store.getSnapshot().draft).toEqual({ genres: ["Rock"] });
  expect(store.getSnapshot().applied).toEqual({});

  vi.advanceTimersByTime(200);
  expect(store.getSnapshot().applied).toEqual({ genres: ["Rock"] });
});

it("restarts the debounce on every change (one apply per burst)", () => {
  const store = new AlbumFilterStore(() => {});
  store.dispatch({ type: "textChanged", text: "a" });
  vi.advanceTimersByTime(150);
  store.dispatch({ type: "textChanged", text: "ab" });
  vi.advanceTimersByTime(150);

  expect(store.getSnapshot().applied).toEqual({});

  vi.advanceTimersByTime(50);
  expect(store.getSnapshot().applied).toEqual({ text: "ab" });
});

it("persists every draft change through the saver", () => {
  const saved: AlbumFilter[] = [];
  const store = new AlbumFilterStore((filter) => saved.push(filter));
  store.dispatch({ type: "genreToggled", genre: "Rock" });
  store.dispatch({ type: "cleared" });

  expect(saved).toEqual([{ genres: ["Rock"] }, {}]);
});

it("notifies listeners on draft and applied changes", () => {
  const store = new AlbumFilterStore(() => {});
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });
  store.dispatch({ type: "textChanged", text: "a" });
  expect(notified).toBe(1);

  vi.advanceTimersByTime(200);
  expect(notified).toBe(2);
});

it("seeds draft and applied from persisted settings without saving back", () => {
  const saved: AlbumFilter[] = [];
  const store = new AlbumFilterStore((filter) => saved.push(filter));
  store.initialize({ genres: ["Jazz"] });

  expect(store.getSnapshot()).toEqual({
    draft: { genres: ["Jazz"] },
    applied: { genres: ["Jazz"] },
  });
  expect(saved).toEqual([]);

  const empty = new AlbumFilterStore(() => {});
  empty.initialize(undefined);
  expect(empty.getSnapshot()).toEqual({ draft: {}, applied: {} });
});
