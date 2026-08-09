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

/** Progress body while an import runs: bar, current file, error count. */
const ImportProgress = ({
  state,
}: {
  readonly state: Extract<ImportEntryState, { status: "importing" }>;
}) => {
  const t = useT();
  const progress = state.progress;
  const ratio =
    progress !== null && progress.phase === "importing" && progress.total > 0
      ? progress.current / progress.total
      : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p
        className="truncate font-mono text-xs text-muted-foreground"
        title={progress?.filePath}
      >
        {progress?.filePath ?? ""}
      </p>
      {progress !== null && progress.errors > 0 && (
        <p className="text-xs text-destructive">
          {t("import.progress.errors", { count: progress.errors })}
        </p>
      )}
      {state.cancelRequested && (
        <p className="text-xs text-muted-foreground">
          {t("import.progress.cancelling")}
        </p>
      )}
    </div>
  );
};

/** Completion body: imported / updated counts and expandable failures. */
const ImportSummaryView = ({
  state,
}: {
  readonly state: Extract<ImportEntryState, { status: "done" }>;
}) => {
  const t = useT();
  const { summary } = state;
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p>{t("import.summary.imported", { count: summary.imported })}</p>
      <p>{t("import.summary.updated", { count: summary.updated })}</p>
      {summary.failed.length > 0 && (
        <details>
          <summary className="cursor-pointer text-destructive">
            {t("import.summary.failed", { count: summary.failed.length })}
          </summary>
          <ul className="mt-2 max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-2 font-mono text-xs">
            {summary.failed.map((failure) => (
              <li key={failure.filePath} className="py-0.5">
                <span className="block break-all">{failure.filePath}</span>
                <span className="block break-all text-muted-foreground">
                  {failure.error.message}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};

/**
 * Import dialog (`docs/specs/v1.0/features/library.md`): confirmation before
 * the run, live progress with cancel while it runs, and a completion summary
 * whose failures are listed in the UI — never left in the console (issue
 * #34). Mounted once in AppLayout; visibility follows the import store.
 */
export const ImportConfirmDialog = () => {
  const state = useSyncExternalStore(
    importStore.subscribe,
    importStore.getSnapshot,
  );
  const t = useT();

  const confirmingFiles = state.status === "confirming" ? state.files : [];

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
          <DialogDescription className="break-all">
            {description(state, t)}
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
              <Button variant="outline" onClick={() => importStore.cancel()}>
                {t("import.dialog.cancel")}
              </Button>
              <Button
                disabled={state.files.length === 0}
                onClick={() => void importStore.startImport()}
              >
                {t("import.dialog.run")}
              </Button>
            </>
          )}
          {state.status === "importing" && (
            <Button
              variant="outline"
              disabled={state.cancelRequested}
              onClick={() => void importStore.cancelImport()}
            >
              {t("import.dialog.cancel")}
            </Button>
          )}
          {(state.status === "done" || state.status === "error") && (
            <Button variant="outline" onClick={() => importStore.cancel()}>
              {t("import.dialog.close")}
            </Button>
          )}
          {state.status === "expanding" && (
            <Button variant="outline" onClick={() => importStore.cancel()}>
              {t("import.dialog.cancel")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
