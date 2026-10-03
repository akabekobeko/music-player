import { afterEach, expect, it, vi } from "vitest";
import { restoreLastView } from "./restoreLastView";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Stub the parts of `window` the restore touches. */
const stubWindow = (hash: string) => {
  const replaceState = vi.fn();
  const location = { hash };
  vi.stubGlobal("window", {
    location,
    history: { state: null, replaceState },
  });
  return { location, replaceState };
};

it("points the hash at the remembered view without adding a history entry", async () => {
  const { location, replaceState } = stubWindow("");

  await restoreLastView({ section: "albums" });

  // Assigning location.hash would push an entry before any user
  // interaction, which Chromium reports in the DevTools Issues panel.
  expect(replaceState).toHaveBeenCalledWith(null, "", "#/albums");
  expect(location.hash).toBe("");
});

it("leaves an existing hash alone", async () => {
  const { replaceState } = stubWindow("#/settings");

  await restoreLastView({ section: "albums" });

  expect(replaceState).not.toHaveBeenCalled();
});

it("changes nothing without a remembered view", async () => {
  const { replaceState } = stubWindow("");

  await restoreLastView(undefined);

  expect(replaceState).not.toHaveBeenCalled();
});
