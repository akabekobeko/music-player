import { createImportStore, type ImportStore } from "./createImportStore";

/** The app-wide import entrance store, wired to `window.mp`. */
export const importStore: ImportStore = createImportStore({
  openImportTargets: () => window.mp.dialog.openImportTargets(),
  expandPaths: (paths) => window.mp.dnd.expandPaths({ paths }),
  importMusics: (request) => window.mp.library.import(request),
  cancelImport: () => window.mp.library.cancelImport(),
});
