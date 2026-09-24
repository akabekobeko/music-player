import type { AppSettings } from "../ipc/types";

/** Settings used on first launch and as the fallback for a broken file. */
export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  window: {
    width: 900,
    height: 670,
    maximized: false,
  },
};
