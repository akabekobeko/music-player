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
import { ImportProgress } from "./ImportProgress";
import { ImportSummaryView } from "./ImportSummaryView";
import { useImportConfirmDialog } from "./useImportConfirmDialog";

/**
 * Import dialog (`docs/specs/v1.0/features/library.md`): confirmation before
 * the run, live progress with cancel while it runs, and a completion summary
 * whose failures are listed in the UI — never left in the console (issue
 * #34). Mounted once in AppLayout; visibility follows the import store.
 */
export const ImportConfirmDialog = () => {
  const t = useT();
  const {
    state,
    confirmingFiles,
    descriptionText,
    cancel,
    startImport,
    cancelImport,
  } = useImportConfirmDialog();

  return (
    <Dialog
      open={state.status !== "idle"}
      onOpenChange={(open) => {
        if (!open) {
          cancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("import.dialog.title")}</DialogTitle>
          <DialogDescription className="break-all">
            {descriptionText}
          </DialogDescription>
        </DialogHeader>
        {confirmingFiles.length > 0 && (
          <ul className="max-h-64 overflow-y-auto rounded-md border bg-muted/30 p-2 font-mono text-xs">
            {confirmingFiles.map((file) => (
              <li key={file} title={file} className="truncate py-0.5">
                {file}
              </li>
            ))}
          </ul>
        )}
        {state.status === "importing" && <ImportProgress state={state} />}
        {state.status === "done" && <ImportSummaryView state={state} />}
        <DialogFooter>
          {state.status === "confirming" && (
            <>
              <Button variant="outline" onClick={cancel}>
                {t("import.dialog.cancel")}
              </Button>
              <Button disabled={state.files.length === 0} onClick={startImport}>
                {t("import.dialog.run")}
              </Button>
            </>
          )}
          {state.status === "importing" && (
            <Button
              variant="outline"
              disabled={state.cancelRequested}
              onClick={cancelImport}
            >
              {t("import.dialog.cancel")}
            </Button>
          )}
          {(state.status === "done" || state.status === "error") && (
            <Button variant="outline" onClick={cancel}>
              {t("import.dialog.close")}
            </Button>
          )}
          {state.status === "expanding" && (
            <Button variant="outline" onClick={cancel}>
              {t("import.dialog.cancel")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
