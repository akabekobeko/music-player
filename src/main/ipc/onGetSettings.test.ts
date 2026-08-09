import { afterEach, expect, it } from "vitest";
import {
  resetSettingsForTest,
  updateSettings,
} from "../settings/settingsManager";
import { DEFAULT_SETTINGS } from "../settings/settingsStore";
import { onGetSettings } from "./onGetSettings";

const ev = {} as Electron.IpcMainInvokeEvent;

afterEach(() => {
  resetSettingsForTest();
});

it("returns the default settings before anything is persisted", async () => {
  const result = await onGetSettings(ev);
  expect(result).toEqual({ ok: true, value: DEFAULT_SETTINGS });
});

it("returns the settings currently in effect", async () => {
  updateSettings({ theme: "dark" });
  const result = await onGetSettings(ev);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.theme).toBe("dark");
  }
});
