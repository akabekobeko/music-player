import type { IpcResult } from "@mp/ipc";
import { expect, it, vi } from "vitest";
import { createQueryStore } from "./queryStore";

const ok = (value: unknown): IpcResult<unknown> => ({ ok: true, value });

/** Fetcher whose promises resolve only when the test says so. */
const createManualFetcher = () => {
  const pending: Array<{
    key: string;
    resolve: (result: IpcResult<unknown>) => void;
  }> = [];
  const fetch = (key: string): Promise<IpcResult<unknown>> =>
    new Promise((resolve) => {
      pending.push({ key, resolve });
    });
  return { fetch, pending };
};

const flush = (): Promise<void> => Promise.resolve();

it("returns the stable loading state for unknown keys", () => {
  const store = createQueryStore(() => new Promise(() => {}));
  expect(store.getSnapshot("artists")).toEqual({ status: "loading" });
  expect(store.getSnapshot("artists")).toBe(store.getSnapshot("artists"));
});

it("starts the fetch on first subscribe and notifies on success", async () => {
  const { fetch, pending } = createManualFetcher();
  const store = createQueryStore(fetch);
  const listener = vi.fn();
  store.subscribe("artists", listener);
  expect(pending).toHaveLength(1);

  pending[0]?.resolve(ok(["a"]));
  await flush();
  expect(listener).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot("artists")).toEqual({
    status: "success",
    value: ["a"],
  });
});

it("does not start a second fetch for an already-subscribed key", () => {
  const { fetch, pending } = createManualFetcher();
  const store = createQueryStore(fetch);
  store.subscribe("artists", vi.fn());
  store.subscribe("artists", vi.fn());
  expect(pending).toHaveLength(1);
});

it("exposes fetch failures as the error state", async () => {
  const store = createQueryStore(() =>
    Promise.resolve({
      ok: false,
      error: { name: "Error", message: "boom" },
    }),
  );
  store.subscribe("artists", vi.fn());
  await flush();
  expect(store.getSnapshot("artists")).toEqual({
    status: "error",
    error: { name: "Error", message: "boom" },
  });
});

it("invalidate refetches keys that still have subscribers", async () => {
  const { fetch, pending } = createManualFetcher();
  const store = createQueryStore(fetch);
  const listener = vi.fn();
  store.subscribe("artists", listener);
  pending[0]?.resolve(ok(["old"]));
  await flush();

  store.invalidate("artists");
  expect(store.getSnapshot("artists")).toEqual({ status: "loading" });
  expect(pending).toHaveLength(2);

  pending[1]?.resolve(ok(["new"]));
  await flush();
  expect(store.getSnapshot("artists")).toEqual({
    status: "success",
    value: ["new"],
  });
});

it("invalidate drops idle keys without refetching", async () => {
  const { fetch, pending } = createManualFetcher();
  const store = createQueryStore(fetch);
  const unsubscribe = store.subscribe("artists", vi.fn());
  pending[0]?.resolve(ok(["a"]));
  await flush();
  unsubscribe();

  store.invalidate();
  expect(pending).toHaveLength(1);
  expect(store.getSnapshot("artists")).toEqual({ status: "loading" });
});

it("discards a response that crossed an invalidation (generation check)", async () => {
  const { fetch, pending } = createManualFetcher();
  const store = createQueryStore(fetch);
  store.subscribe("artists", vi.fn());

  store.invalidate("artists"); // First request is now stale.
  pending[0]?.resolve(ok(["stale"]));
  await flush();
  expect(store.getSnapshot("artists")).toEqual({ status: "loading" });

  pending[1]?.resolve(ok(["fresh"]));
  await flush();
  expect(store.getSnapshot("artists")).toEqual({
    status: "success",
    value: ["fresh"],
  });
});

it("the last unsubscribe drops the cache entry", async () => {
  const { fetch, pending } = createManualFetcher();
  const store = createQueryStore(fetch);
  const unsubscribe = store.subscribe("artists", vi.fn());
  pending[0]?.resolve(ok(["a"]));
  await flush();

  unsubscribe();
  expect(store.getSnapshot("artists")).toEqual({ status: "loading" });
});
