import type { AppSettings } from "./ipc/types";

/**
 * Window-state restoration rules
 * (`docs/specs/v1.0/architecture/process-model.md`): position / size /
 * maximized live in `AppSettings.window`; restoring must survive display
 * configuration changes (an unplugged monitor must not leave the window
 * stranded off-screen). Pure — `main.ts` feeds in `screen.getAllDisplays()`.
 */

/** A display's usable rectangle (`Display.workArea`). */
export type WorkArea = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** Bounds handed to the `BrowserWindow` constructor. */
export type RestoredBounds = {
  readonly x?: number;
  readonly y?: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Minimum overlap (px, both axes) between the saved window rect and some
 * display before the saved position is trusted. Smaller overlaps would
 * technically be "on screen" but leave nothing draggable.
 */
const MIN_VISIBLE_PX = 64;

/**
 * Decide the constructor bounds from the saved window state.
 *
 * The saved position is kept only when the window would still be usably
 * visible on one of the current displays; otherwise it is dropped so the OS
 * places the window (its default centering), keeping the saved size.
 *
 * @param saved - Persisted `AppSettings.window` (position may be unset on
 *   first launch).
 * @param workAreas - Work areas of every connected display.
 * @returns Bounds for the `BrowserWindow` constructor.
 */
export const resolveWindowBounds = (
  saved: AppSettings["window"],
  workAreas: readonly WorkArea[],
): RestoredBounds => {
  const size = { width: saved.width, height: saved.height };
  if (saved.x === undefined || saved.y === undefined) {
    return size;
  }

  const visible = workAreas.some((area) => {
    const overlapX =
      Math.min((saved.x as number) + saved.width, area.x + area.width) -
      Math.max(saved.x as number, area.x);
    const overlapY =
      Math.min((saved.y as number) + saved.height, area.y + area.height) -
      Math.max(saved.y as number, area.y);
    return overlapX >= MIN_VISIBLE_PX && overlapY >= MIN_VISIBLE_PX;
  });
  return visible ? { ...size, x: saved.x, y: saved.y } : size;
};
