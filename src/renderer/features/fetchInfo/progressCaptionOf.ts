import type { FetchProgressPayload } from "@mp/ipc";

/** What the running dialog shows under the counter. */
export type ProgressCaption =
  | {
      /** Discriminant: Main is searching the release of the next group. */
      readonly kind: "searching";
      /** Album title of that group; empty for the unknown album. */
      readonly album: string;
    }
  | {
      /** Discriminant: Main is inside a group, writing track by track. */
      readonly kind: "processed";
      /** File of the track just processed. */
      readonly filePath: string;
    }
  | null;

/** The one field of a track the caption needs. */
export type CaptionGroupInput = {
  /** Album title; empty when unset. */
  readonly album: string;
};

/**
 * Caption of the running fetch dialog
 * (`docs/specs/v1.2/features/fetch-dialog.md`).
 *
 * Main processes the album groups in order and searches each group's
 * release before writing its tracks, during which `current` stands still.
 * So when the next track (index `current`) is the first of its group, the
 * group is being searched and the caption names the album; otherwise the
 * caption shows the file just processed. `null` once every track is done.
 *
 * @param groups - The album groups in Main's order (`groupMusicsByAlbum`).
 * @param progress - Latest push, `null` before the first.
 * @returns The caption to render.
 */
export const progressCaptionOf = (
  groups: ReadonlyArray<readonly CaptionGroupInput[]>,
  progress: FetchProgressPayload | null,
): ProgressCaption => {
  const current = progress?.current ?? 0;
  let start = 0;
  for (const group of groups) {
    if (current === start) {
      return { kind: "searching", album: group[0]?.album ?? "" };
    }

    start += group.length;
    if (current < start) {
      return progress === null
        ? null
        : { kind: "processed", filePath: progress.filePath };
    }
  }

  return null;
};
