import { afterEach, expect, it } from "vitest";
import { getSettings, resetSettingsForTest } from "../settings/settingsManager";
import { onSetSettings } from "./onSetSettings";

const ev = {} as Electron.IpcMainInvokeEvent;

afterEach(() => {
  resetSettingsForTest();
});

it("merges the patch and returns the full snapshot", async () => {
  const result = await onSetSettings(ev, { patch: { theme: "dark" } });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.theme).toBe("dark");
    expect(result.value.window).toEqual(getSettings().window);
  }
});

it("keeps the in-memory settings in sync with the response", async () => {
  await onSetSettings(ev, { patch: { locale: "ja" } });
  expect(getSettings().locale).toBe("ja");
});

it("tolerates an empty patch", async () => {
  const before = getSettings();
  const result = await onSetSettings(ev, { patch: {} });
  expect(result).toEqual({ ok: true, value: before });
});
