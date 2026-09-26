import type { FetchMusicInfoSummary, IpcResult, Music } from "@mp/ipc";
import { expect, it, vi } from "vitest";
import { createFetchInfoStore } from "./createFetchInfoStore";
import type { FetchInfoBridge } from "./types";

const ok = <T>(value: T): IpcResult<T> => ({ ok: true, value });
const err = (code: string): IpcResult<never> => ({
  ok: false,
  error: { name: "Error", code, message: code },
});

const music = (id: number): Music =>
  ({ id, filePath: `/${id}.mp3`, title: `T${id}` }) as Music;

const summary = (
  overrides: Partial<FetchMusicInfoSummary> = {},
): FetchMusicInfoSummary => ({
  updated: [],
  unchanged: [],
  notFound: [],
  failed: [],
  cancelled: false,
  ...overrides,
});

const createBridge = (
  overrides: Partial<FetchInfoBridge> = {},
): FetchInfoBridge => ({
  fetchMusicInfo: vi.fn(async () => ok(summary())),
  cancelFetch: vi.fn(async () => ok(undefined)),
  applied: vi.fn(),
  ...overrides,
});

it("starts idle and opens into confirming with the given tracks", () => {
  const store = createFetchInfoStore(createBridge());
  expect(store.getSnapshot()).toEqual({ status: "idle" });

  store.open([music(1), music(2)]);
  expect(store.getSnapshot()).toEqual({
    status: "confirming",
    musics: [music(1), music(2)],
  });
});

it("ignores an empty open and an open while running", async () => {
  let resolve: ((value: IpcResult<FetchMusicInfoSummary>) => void) | undefined;
  const bridge = createBridge({
    fetchMusicInfo: vi.fn(
      () =>
        new Promise<IpcResult<FetchMusicInfoSummary>>((r) => {
          resolve = r;
        }),
    ),
  });
  const store = createFetchInfoStore(bridge);

  store.open([]);
  expect(store.getSnapshot().status).toBe("idle");

  store.open([music(1)]);
  const run = store.start();
  store.open([music(2)]);
  expect(store.getSnapshot()).toMatchObject({
    status: "running",
    musics: [music(1)],
  });

  resolve?.(ok(summary()));
  await run;
});

it("runs the fetch for the confirmed ids and lands in done", async () => {
  const bridge = createBridge();
  const store = createFetchInfoStore(bridge);
  store.open([music(3), music(1)]);

  await store.start();

  expect(bridge.fetchMusicInfo).toHaveBeenCalledWith({ musicIds: [3, 1] });
  expect(store.getSnapshot()).toEqual({
    status: "done",
    musics: [music(3), music(1)],
    summary: summary(),
  });
  expect(bridge.applied).not.toHaveBeenCalled();
});

it("hands updated tracks to the applied listener before done", async () => {
  const updated = [{ music: music(1), displayArtist: "A", albumKey: "k" }];
  const bridge = createBridge({
    fetchMusicInfo: vi.fn(async () => ok(summary({ updated }))),
  });
  const store = createFetchInfoStore(bridge);
  store.open([music(1)]);

  await store.start();

  expect(bridge.applied).toHaveBeenCalledWith({ targets: [music(1)], updated });
});

it("tallies progress pushes while running and ignores them otherwise", async () => {
  let resolve: ((value: IpcResult<FetchMusicInfoSummary>) => void) | undefined;
  const store = createFetchInfoStore(
    createBridge({
      fetchMusicInfo: vi.fn(
        () =>
          new Promise<IpcResult<FetchMusicInfoSummary>>((r) => {
            resolve = r;
          }),
      ),
    }),
  );
  store.handleProgress({
    current: 1,
    total: 1,
    filePath: "/x",
    result: "updated",
  });
  expect(store.getSnapshot().status).toBe("idle");

  store.open([music(1), music(2), music(3)]);
  const run = store.start();
  store.handleProgress({
    current: 1,
    total: 3,
    filePath: "/1.mp3",
    result: "updated",
  });
  store.handleProgress({
    current: 2,
    total: 3,
    filePath: "/2.mp3",
    result: "notFound",
  });
  store.handleProgress({
    current: 3,
    total: 3,
    filePath: "/3.mp3",
    result: "updated",
  });

  expect(store.getSnapshot()).toMatchObject({
    status: "running",
    progress: { current: 3, filePath: "/3.mp3" },
    counts: { updated: 2, unchanged: 0, notFound: 1, failed: 0 },
  });

  resolve?.(ok(summary({ cancelled: true })));
  await run;
  expect(store.getSnapshot()).toMatchObject({
    status: "done",
    summary: { cancelled: true },
  });
});

it("requests cancellation once and disables the button", async () => {
  let resolve: ((value: IpcResult<FetchMusicInfoSummary>) => void) | undefined;
  const bridge = createBridge({
    fetchMusicInfo: vi.fn(
      () =>
        new Promise<IpcResult<FetchMusicInfoSummary>>((r) => {
          resolve = r;
        }),
    ),
  });
  const store = createFetchInfoStore(bridge);
  store.open([music(1)]);
  const run = store.start();

  await store.cancelFetch();
  await store.cancelFetch();

  expect(bridge.cancelFetch).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot()).toMatchObject({
    status: "running",
    cancelRequested: true,
  });
  store.close();
  expect(store.getSnapshot().status).toBe("running");

  resolve?.(ok(summary({ cancelled: true })));
  await run;
  store.close();
  expect(store.getSnapshot()).toEqual({ status: "idle" });
});

it("lands in error when the channel refuses (busy) or rejects", async () => {
  const busy = createFetchInfoStore(
    createBridge({ fetchMusicInfo: vi.fn(async () => err("MB_BUSY")) }),
  );
  busy.open([music(1)]);
  await busy.start();
  expect(busy.getSnapshot()).toMatchObject({
    status: "error",
    error: { code: "MB_BUSY" },
  });

  const thrown = createFetchInfoStore(
    createBridge({
      fetchMusicInfo: vi.fn(async () => {
        throw new Error("bridge down");
      }),
    }),
  );
  thrown.open([music(1)]);
  await thrown.start();
  expect(thrown.getSnapshot()).toMatchObject({
    status: "error",
    error: { message: "bridge down" },
  });
  thrown.close();
  expect(thrown.getSnapshot()).toEqual({ status: "idle" });
});

it("re-enables Cancel when the cancel call fails", async () => {
  let resolve: ((value: IpcResult<FetchMusicInfoSummary>) => void) | undefined;
  const bridge = createBridge({
    fetchMusicInfo: vi.fn(
      () =>
        new Promise<IpcResult<FetchMusicInfoSummary>>((r) => {
          resolve = r;
        }),
    ),
    cancelFetch: vi
      .fn()
      .mockRejectedValueOnce(new Error("ipc down"))
      .mockResolvedValueOnce(ok(undefined)),
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  const store = createFetchInfoStore(bridge);
  store.open([music(1)]);
  const run = store.start();

  await store.cancelFetch();
  expect(store.getSnapshot()).toMatchObject({
    status: "running",
    cancelRequested: false,
  });

  await store.cancelFetch();
  expect(store.getSnapshot()).toMatchObject({
    status: "running",
    cancelRequested: true,
  });
  expect(bridge.cancelFetch).toHaveBeenCalledTimes(2);

  resolve?.(ok(summary({ cancelled: true })));
  await run;
  vi.restoreAllMocks();
});
