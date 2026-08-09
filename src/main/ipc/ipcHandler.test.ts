import { ipcMain } from "electron";
import { afterEach, expect, it, vi } from "vitest";
import { initializeIpcEvents, releaseIpcEvents } from "./ipcHandler";
import { IpcKeys } from "./ipcKeys";

afterEach(() => {
  releaseIpcEvents();
  vi.restoreAllMocks();
});

it("registers every implemented invoke handler", () => {
  const handle = vi.spyOn(ipcMain, "handle");

  initializeIpcEvents();

  expect(handle).toHaveBeenCalledWith(
    IpcKeys.GetVersions,
    expect.any(Function),
  );
  expect(handle).toHaveBeenCalledWith(
    IpcKeys.GetSettings,
    expect.any(Function),
  );
  expect(handle).toHaveBeenCalledWith(
    IpcKeys.SetSettings,
    expect.any(Function),
  );
});

it("is idempotent — a second call registers nothing", () => {
  const handle = vi.spyOn(ipcMain, "handle");

  initializeIpcEvents();
  const callsAfterFirst = handle.mock.calls.length;
  initializeIpcEvents();

  expect(handle.mock.calls.length).toBe(callsAfterFirst);
});

it("can re-register after releaseIpcEvents", () => {
  const handle = vi.spyOn(ipcMain, "handle");

  initializeIpcEvents();
  const callsPerInit = handle.mock.calls.length;
  releaseIpcEvents();
  initializeIpcEvents();

  expect(handle).toHaveBeenCalledTimes(callsPerInit * 2);
});
