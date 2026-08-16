import { expect, it, vi } from "vitest";
import { SidebarStore } from "./sidebarStore";

it("starts open", () => {
  const store = new SidebarStore();
  expect(store.getSnapshot()).toBe(true);
});

it("toggles between open and closed", () => {
  const store = new SidebarStore();
  store.toggle();
  expect(store.getSnapshot()).toBe(false);
  store.toggle();
  expect(store.getSnapshot()).toBe(true);
});

it("notifies listeners on toggle and stops after unsubscribe", () => {
  const store = new SidebarStore();
  const listener = vi.fn();
  const unsubscribe = store.subscribe(listener);
  store.toggle();
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
  store.toggle();
  expect(listener).toHaveBeenCalledTimes(1);
});
