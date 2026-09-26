import { useMemo } from "react";
import type { FetchInfoState } from "@/features/fetchInfo/fetchInfoStore/types";
import { useT } from "@/features/i18n/useT";
import { Stack } from "../stacks";

type Props = {
  /** The store's "done" state; its `summary` and tracks are rendered. */
  readonly state: Extract<FetchInfoState, { status: "done" }>;
};

/**
 * Completion body: the four outcome counts, with the "not found" titles and
 * the failures expandable. The not-found list is the user's cue to fix tags
 * and retry, or to fetch those songs one by one from the info dialog
 * (`docs/specs/v1.2/features/fetch-dialog.md`).
 */
export const FetchSummaryView = ({ state }: Props) => {
  const t = useT();
  const { summary, musics } = state;
  // Built once per run: the lists can hold hundreds of entries each.
  const titles = useMemo(
    () => new Map(musics.map((music) => [music.id, music.title])),
    [musics],
  );
  const titleOf = (musicId: number): string =>
    titles.get(musicId) ?? String(musicId);
  return (
    <Stack className="text-sm">
      <p>{t("fetch.result.updated", { count: summary.updated.length })}</p>
      <p>{t("fetch.result.unchanged", { count: summary.unchanged.length })}</p>
      {summary.notFound.length === 0 ? (
        <p>{t("fetch.result.notFound", { count: 0 })}</p>
      ) : (
        <details>
          <summary className="cursor-pointer">
            {t("fetch.result.notFound", { count: summary.notFound.length })} (
            {t("fetch.result.details")})
          </summary>
          {/* details cannot become a flex container (summary marker breaks),
              so the expanded body spaces itself with padding. */}
          <div className="pt-2">
            <ul className="max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-2 text-xs">
              {summary.notFound.map((entry) => (
                <li key={entry.musicId} className="break-all py-0.5">
                  {titleOf(entry.musicId)}
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
      {summary.failed.length === 0 ? (
        <p>{t("fetch.result.failed", { count: 0 })}</p>
      ) : (
        <details>
          <summary className="cursor-pointer text-destructive">
            {t("fetch.result.failed", { count: summary.failed.length })} (
            {t("fetch.result.details")})
          </summary>
          <div className="pt-2">
            <ul className="max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-2 font-mono text-xs">
              {summary.failed.map((failure) => (
                <li key={failure.musicId} className="py-0.5">
                  <span className="block break-all">
                    {failure.filePath !== ""
                      ? failure.filePath
                      : titleOf(failure.musicId)}
                  </span>
                  <span className="block break-all text-muted-foreground">
                    {failure.error.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </Stack>
  );
};
