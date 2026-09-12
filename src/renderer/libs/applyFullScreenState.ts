/**
 * Mirror the window's full-screen state onto `<html data-fullscreen>` so the
 * title-bar safe-area rules in `App.css` can react to it (macOS drops the
 * traffic-light inset while in full screen).
 *
 * @param fullScreen - Whether the window is in full-screen mode.
 * @param root - Element to stamp; defaults to `document.documentElement`.
 */
export const applyFullScreenState = (
  fullScreen: boolean,
  root: Pick<HTMLElement, "dataset"> = document.documentElement,
): void => {
  if (fullScreen) {
    root.dataset.fullscreen = "true";
  } else {
    delete root.dataset.fullscreen;
  }
};
