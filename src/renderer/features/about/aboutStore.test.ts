import type { Versions } from "@mp/ipc";
import { expect, it } from "vitest";
import { AboutStore } from "./aboutStore";

const VERSIONS: Versions = {
  app: "1.0.0",
  electron: "43.0.0",
  chrome: "142.0.0.0",
  node: "22.0.0",
};

it("opens with a pending versions request, then resolves", async () => {
  let resolve: (() => void) | undefined;
  const store = new AboutStore(
    () =>
      new Promise((r) => {
        resolve = () => r({ ok: true, value: VERSIONS });
      }),
  );

  store.open();
  expect(store.getSnapshot()).toEqual({
    open: true,
    versions: null,
    error: null,
  });

  resolve?.();
  await Promise.resolve();
  expect(store.getSnapshot()).toEqual({
    open: true,
    versions: VERSIONS,
    error: null,
  });
});

it("surfaces a failed versions request", async () => {
  const store = new AboutStore(async () => ({
    ok: false,
    error: { name: "Error", message: "boom" },
  }));
  store.open();
  await Promise.resolve();
  expect(store.getSnapshot()).toEqual({
    open: true,
    versions: null,
    error: { name: "Error", message: "boom" },
  });
});

it("discards a response that arrives after closing", async () => {
  let resolve: (() => void) | undefined;
  const store = new AboutStore(
    () =>
      new Promise((r) => {
        resolve = () => r({ ok: true, value: VERSIONS });
      }),
  );
  store.open();
  store.close();
  resolve?.();
  await Promise.resolve();
  expect(store.getSnapshot()).toEqual({ open: false });
});
