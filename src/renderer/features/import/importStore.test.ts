import type { ImportSummary, IpcResult } from "@mp/ipc";
import { expect, it, vi } from "vitest";
import { createImportStore, type ImportBridge } from "./importStore";

const ok = <T>(value: T): IpcResult<T> => ({ ok: true, value });
const err = (message: string): IpcResult<never> => ({
  ok: false,
  error: { name: "Error", message },
});

const createBridge = (overrides: Partial<ImportBridge> = {}): ImportBridge => ({
  openImportTargets: vi.fn(async () => ok({ paths: ["/music"] })),
  expandPaths: vi.fn(async () => ok({ files: ["/music/a.mp3"] })),
  importMusics: vi.fn(async () => ok({ imported: 1, updated: 0, failed: [] })),
  ...overrides,
});

it("starts idle", () => {
  const store = createImportStore(createBridge());
  expect(store.getSnapshot()).toEqual({ status: "idle" });
});

it("dialog pick expands into the confirming state", async () => {
  const bridge = createBridge();
  const store = createImportStore(bridge);
  await store.openFromDialog();
  expect(bridge.expandPaths).toHaveBeenCalledWith(["/music"]);
  expect(store.getSnapshot()).toEqual({
    status: "confirming",
    files: ["/music/a.mp3"],
  });
});

it("a cancelled dialog leaves the state untouched", async () => {
  const bridge = createBridge({
    openImportTargets: vi.fn(async () => ok({ paths: [] })),
  });
  const store = createImportStore(bridge);
  await store.openFromDialog();
  expect(store.getSnapshot()).toEqual({ status: "idle" });
  expect(bridge.expandPaths).not.toHaveBeenCalled();
});

it("dropped paths expand into the confirming state", async () => {
  const store = createImportStore(createBridge());
  await store.addPaths(["/music"]);
  expect(store.getSnapshot()).toEqual({
    status: "confirming",
    files: ["/music/a.mp3"],
  });
});

it("a second drop merges, de-duplicates, and sorts the file list", async () => {
  const expandPaths = vi
    .fn()
    .mockResolvedValueOnce(ok({ files: ["/b.mp3", "/a.mp3"] }))
    .mockResolvedValueOnce(ok({ files: ["/a.mp3", "/c.mp3"] }));
  const store = createImportStore(createBridge({ expandPaths }));
  await store.addPaths(["/first"]);
  await store.addPaths(["/second"]);
  expect(store.getSnapshot()).toEqual({
    status: "confirming",
    files: ["/a.mp3", "/b.mp3", "/c.mp3"],
  });
});

it("an empty drop is ignored", async () => {
  const bridge = createBridge();
  const store = createImportStore(bridge);
  await store.addPaths([]);
  expect(bridge.expandPaths).not.toHaveBeenCalled();
});

it("expansion failure lands in the error state", async () => {
  const store = createImportStore(
    createBridge({ expandPaths: vi.fn(async () => err("scan failed")) }),
  );
  await store.addPaths(["/music"]);
  expect(store.getSnapshot()).toEqual({
    status: "error",
    error: { name: "Error", message: "scan failed" },
  });
});

it("startImport sends the confirmed files and closes on success", async () => {
  const bridge = createBridge();
  const store = createImportStore(bridge);
  await store.addPaths(["/music"]);
  await store.startImport();
  expect(bridge.importMusics).toHaveBeenCalledWith({
    paths: ["/music/a.mp3"],
  });
  expect(store.getSnapshot()).toEqual({ status: "idle" });
});

it("startImport failure lands in the error state", async () => {
  const store = createImportStore(
    createBridge({ importMusics: vi.fn(async () => err("import failed")) }),
  );
  await store.addPaths(["/music"]);
  await store.startImport();
  expect(store.getSnapshot()).toEqual({
    status: "error",
    error: { name: "Error", message: "import failed" },
  });
});

it("a rejected bridge promise is normalised into the error state", async () => {
  const store = createImportStore(
    createBridge({
      importMusics: vi.fn(async () => {
        throw new Error("No handler registered");
      }),
    }),
  );
  await store.addPaths(["/music"]);
  await store.startImport();
  expect(store.getSnapshot()).toEqual({
    status: "error",
    error: { name: "Error", message: "No handler registered" },
  });
});

it("startImport without confirmation is a no-op", async () => {
  const bridge = createBridge();
  const store = createImportStore(bridge);
  await store.startImport();
  expect(bridge.importMusics).not.toHaveBeenCalled();
});

it("cancel closes the dialog from confirming", async () => {
  const store = createImportStore(createBridge());
  await store.addPaths(["/music"]);
  store.cancel();
  expect(store.getSnapshot()).toEqual({ status: "idle" });
});

it("cancel is ignored while an import runs", async () => {
  let resolveImport: (value: IpcResult<ImportSummary>) => void = () => {};
  const store = createImportStore(
    createBridge({
      importMusics: vi.fn(
        () =>
          new Promise<IpcResult<ImportSummary>>((resolve) => {
            resolveImport = resolve;
          }),
      ),
    }),
  );
  await store.addPaths(["/music"]);
  const running = store.startImport();
  store.cancel();
  expect(store.getSnapshot().status).toBe("importing");
  resolveImport(err("stopped"));
  await running;
});

it("notifies subscribers on every transition and stops after unsubscribe", async () => {
  const store = createImportStore(createBridge());
  const listener = vi.fn();
  const unsubscribe = store.subscribe(listener);
  await store.addPaths(["/music"]); // expanding → confirming
  expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe();
  store.cancel();
  expect(listener).toHaveBeenCalledTimes(2);
});
