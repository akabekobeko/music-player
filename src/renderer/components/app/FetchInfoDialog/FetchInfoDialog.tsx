import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/features/i18n/useT";
import { FetchGroupList } from "./FetchGroupList";
import { FetchProgress } from "./FetchProgress";
import { FetchSummaryView } from "./FetchSummaryView";
import { useFetchInfoDialog } from "./useFetchInfoDialog";

/**
 * Fetch dialog (`docs/specs/v1.2/features/fetch-dialog.md`): confirmation
 * listing the album groups before the run, live progress with cancel while
 * it runs, and a completion summary whose not-found titles and failures
 * are listed in the UI. Built like the import dialog; mounted once in
 * AppLayout, visibility follows the fetch store.
 */
export const FetchInfoDialog = () => {
  const t = useT();
  const {
    state,
    groupRows,
    descriptionText,
    stopsPlayback,
    caption,
    start,
    cancelFetch,
    close,
  } = useFetchInfoDialog();

  return (
    <Dialog
      open={state.status !== "idle"}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("fetch.dialog.title")}</DialogTitle>
          <DialogDescription className="break-all">
            {descriptionText}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {state.status === "confirming" && <FetchGroupList rows={groupRows} />}
          {state.status === "confirming" && stopsPlayback && (
            <p className="text-muted-foreground text-xs">
              {t("fetch.dialog.willStopPlayback")}
            </p>
          )}
          {state.status === "running" && (
            <FetchProgress state={state} caption={caption} />
          )}
          {state.status === "done" && <FetchSummaryView state={state} />}
        </DialogBody>
        <DialogFooter>
          {state.status === "confirming" && (
            <>
              <Button variant="outline" onClick={close}>
                {t("fetch.dialog.cancel")}
              </Button>
              <Button onClick={start}>{t("fetch.dialog.run")}</Button>
            </>
          )}
          {state.status === "running" && (
            <Button
              variant="outline"
              disabled={state.cancelRequested}
              onClick={cancelFetch}
            >
              {t("fetch.dialog.cancel")}
            </Button>
          )}
          {(state.status === "done" || state.status === "error") && (
            <Button variant="outline" onClick={close}>
              {t("fetch.dialog.close")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
