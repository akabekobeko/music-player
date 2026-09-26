import type { FetchInfoState } from "@/features/fetchInfo/fetchInfoStore/types";
import type { ProgressCaption } from "@/features/fetchInfo/progressCaptionOf";
import { useT } from "@/features/i18n/useT";
import { Stack } from "../stacks";

type Props = {
  /** The store's "running" state: latest push, tallies, cancel flag. */
  readonly state: Extract<FetchInfoState, { status: "running" }>;
  /** What Main is doing right now (searching an album or writing a track). */
  readonly caption: ProgressCaption;
};

/** Progress body while a fetch runs: bar, caption, outcome counters. */
export const FetchProgress = ({ state, caption }: Props) => {
  const t = useT();
  // Main's total excludes ids no longer in the library, so the push, not
  // the target list, is the authority once the run has started.
  const total = state.progress?.total ?? state.musics.length;
  const current = state.progress?.current ?? 0;
  const ratio = total > 0 ? current / total : 0;
  const { counts } = state;
  return (
    <Stack>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className="break-all font-mono text-muted-foreground text-xs">
        {caption?.kind === "searching" &&
          t("fetch.progress.searching", {
            album:
              caption.album !== ""
                ? caption.album
                : t("fetch.dialog.unknownAlbum"),
          })}
        {caption?.kind === "processed" && caption.filePath}
      </p>
      <p className="text-muted-foreground text-xs">
        {[
          t("fetch.result.updated", { count: counts.updated }),
          t("fetch.result.unchanged", { count: counts.unchanged }),
          t("fetch.result.notFound", { count: counts.notFound }),
          t("fetch.result.failed", { count: counts.failed }),
        ].join(" · ")}
      </p>
      {state.cancelRequested && (
        <p className="text-muted-foreground text-xs">
          {t("fetch.progress.cancelling")}
        </p>
      )}
    </Stack>
  );
};
