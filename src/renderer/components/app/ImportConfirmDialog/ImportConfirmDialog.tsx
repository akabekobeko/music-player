import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/features/i18n/useT";
import {
  type ImportEntryState,
  importStore,
} from "@/features/import/importStore";

/** Body copy for each store state (files list rendered separately). */
const description = (
  state: ImportEntryState,
  t: ReturnType<typeof useT>,
): string => {
  switch (state.status) {
    case "expanding":
      return t("import.dialog.expanding");
    case "confirming":
    case "importing":
      return state.files.length === 0
        ? t("import.dialog.empty")
        : t("import.dialog.count", { count: state.files.length });
    case "error":
      return t("import.dialog.failed", { message: state.error.message });
    default:
      return "";
  }
};

/**
 * Confirmation dialog shown between path expansion and the actual import
 * (`docs/specs/v1.0/features/library.md`): the user sees the resolved file
 * count and list, and `mp:library:import` runs only after Import is pressed.
 * Mounted once in AppLayout; visibility follows the import store.
 */
export const ImportConfirmDialog = () => {
  const state = useSyncExternalStore(
    importStore.subscribe,
    importStore.getSnapshot,
  );
  const t = useT();

  const files =
    state.status === "confirming" || state.status === "importing"
      ? state.files
      : [];

  return (
    <Dialog
      open={state.status !== "idle"}
      onOpenChange={(open) => {
        if (!open) {
          importStore.cancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("import.dialog.title")}</DialogTitle>
          <DialogDescription>{description(state, t)}</DialogDescription>
        </DialogHeader>
        {files.length > 0 && (
          <ul className="max-h-64 overflow-y-auto rounded-md border bg-muted/30 p-2 font-mono text-xs">
            {files.map((file) => (
              <li key={file} title={file} className="truncate py-0.5">
                {file}
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          {state.status === "error" ? (
            <Button variant="outline" onClick={() => importStore.cancel()}>
              {t("import.dialog.close")}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={state.status === "importing"}
                onClick={() => importStore.cancel()}
              >
                {t("import.dialog.cancel")}
              </Button>
              <Button
                disabled={
                  state.status !== "confirming" || state.files.length === 0
                }
                onClick={() => void importStore.startImport()}
              >
                {t("import.dialog.run")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
