import { expect, it, vi } from "vitest";
import { menuActionBus } from "./menuActionBus";

it("delivers published actions to subscribers", () => {
  const listener = vi.fn();
  const unsubscribe = menuActionBus.subscribe(listener);
  menuActionBus.publish("import");
  expect(listener).toHaveBeenCalledWith("import");
  unsubscribe();
});

it("stops delivering after unsubscribe", () => {
  const listener = vi.fn();
  const unsubscribe = menuActionBus.subscribe(listener);
  unsubscribe();
  menuActionBus.publish("openSettings");
  expect(listener).not.toHaveBeenCalled();
});

it("supports multiple independent subscribers", () => {
  const first = vi.fn();
  const second = vi.fn();
  const unsubFirst = menuActionBus.subscribe(first);
  const unsubSecond = menuActionBus.subscribe(second);
  menuActionBus.publish("showAbout");
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  unsubFirst();
  unsubSecond();
});
