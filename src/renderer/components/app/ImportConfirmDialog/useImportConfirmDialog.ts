import { useSyncExternalStore } from "react";
import { useT } from "@/features/i18n/useT";
import { importStore } from "@/features/import/importStore/importStore";
import type { ImportEntryState } from "@/features/import/importStore/types";

/** Body copy for each store state (details rendered separately). */
const description = (
  state: ImportEntryState,
  t: ReturnType<typeof useT>,
): string => {
  switch (state.status) {
    case "expanding":
      return t("import.dialog.expanding");
    case "confirming":
      return state.files.length === 0
        ? t("import.dialog.empty")
        : t("import.dialog.count", { count: state.files.length });
    case "importing":
      return state.progress === null || state.progress.phase === "enumerating"
        ? t("import.dialog.expanding")
        : t("import.progress.importing", {
            current: state.progress.current,
            total: state.progress.total,
          });
    case "done":
      return state.cancelled
        ? t("import.summary.cancelled")
        : t("import.summary.done");
    case "error":
      return t("import.dialog.failed", { message: state.error.message });
    default:
      return "";
  }
};

/**
 * Logic of `ImportConfirmDialog`: the import store's state, the per-state
 * body copy, and the store commands. Visibility follows the store — the
 * dialog holds no state of its own.
 */
export const useImportConfirmDialog = () => {
  const t = useT();
  const state = useSyncExternalStore(
    importStore.subscribe,
    importStore.getSnapshot,
  );

  const confirmingFiles = state.status === "confirming" ? state.files : [];
  const descriptionText = description(state, t);

  const cancel = (): void => {
    importStore.cancel();
  };

  const startImport = (): void => {
    void importStore.startImport();
  };

  const cancelImport = (): void => {
    void importStore.cancelImport();
  };

  return {
    state,
    confirmingFiles,
    descriptionText,
    cancel,
    startImport,
    cancelImport,
  };
};
