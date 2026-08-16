import { expect, it, vi } from "vitest";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SidebarStore,
} from "./sidebarStore";

it("starts open with the default width", () => {
  const store = new SidebarStore(vi.fn());
  expect(store.getSnapshot()).toEqual({
    open: true,
    width: SIDEBAR_DEFAULT_WIDTH,
  });
});

it("toggles between open and closed", () => {
  const store = new SidebarStore(vi.fn());
  store.toggle();
  expect(store.getSnapshot().open).toBe(false);
  store.toggle();
  expect(store.getSnapshot().open).toBe(true);
});

it("notifies listeners on toggle and stops after unsubscribe", () => {
  const store = new SidebarStore(vi.fn());
  const listener = vi.fn();
  const unsubscribe = store.subscribe(listener);
  store.toggle();
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
  store.toggle();
  expect(listener).toHaveBeenCalledTimes(1);
});

it("persists every toggle and width change through the saver", () => {
  const save = vi.fn();
  const store = new SidebarStore(save);
  store.toggle();
  expect(save).toHaveBeenLastCalledWith({
    open: false,
    width: SIDEBAR_DEFAULT_WIDTH,
  });
  store.setWidth(300);
  expect(save).toHaveBeenLastCalledWith({ open: false, width: 300 });
});

it("clamps the width to the allowed range", () => {
  const store = new SidebarStore(vi.fn());
  store.setWidth(1);
  expect(store.getSnapshot().width).toBe(SIDEBAR_MIN_WIDTH);
  store.setWidth(10_000);
  expect(store.getSnapshot().width).toBe(SIDEBAR_MAX_WIDTH);
});

it("ignores a width change that clamps to the current value", () => {
  const save = vi.fn();
  const listener = vi.fn();
  const store = new SidebarStore(save);
  store.subscribe(listener);
  store.setWidth(SIDEBAR_DEFAULT_WIDTH + 0.4);
  expect(save).not.toHaveBeenCalled();
  expect(listener).not.toHaveBeenCalled();
});

it("initializes from persisted settings without saving back", () => {
  const save = vi.fn();
  const store = new SidebarStore(save);
  store.initialize({ open: false, width: 320 });
  expect(store.getSnapshot()).toEqual({ open: false, width: 320 });
  expect(save).not.toHaveBeenCalled();
});

it("keeps the defaults when no settings were persisted", () => {
  const store = new SidebarStore(vi.fn());
  store.initialize(undefined);
  expect(store.getSnapshot()).toEqual({
    open: true,
    width: SIDEBAR_DEFAULT_WIDTH,
  });
});
