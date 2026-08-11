import { importStore } from "./importStore/importStore";

/**
 * Accept file drops anywhere in the window
 * (`docs/specs/v1.0/features/library.md`).
 *
 * App-lifetime listener registered once from the bootstrap (never
 * unregistered, immune to StrictMode double-mounting). `dragover` must be
 * prevented or Chromium performs its default navigation instead of firing
 * `drop`. Paths come from `mp.dnd.pathFor` (`webUtils.getPathForFile`) — the
 * only way to resolve a `File` to a filesystem path since `File.path` was
 * removed.
 */
export const registerWindowDropHandler = (): void => {
  document.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  document.addEventListener("drop", (event) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files === undefined || files.length === 0) {
      return;
    }

    const paths = [...files]
      .map((file) => window.mp.dnd.pathFor(file))
      .filter((path) => path !== "");
    void importStore.addPaths(paths);
  });
};
