import type { Music } from "@mp/ipc";
import { useMemo, useSyncExternalStore } from "react";
import { fetchInfoStore } from "@/features/fetchInfo/fetchInfoStore/fetchInfoStore";
import type { FetchInfoState } from "@/features/fetchInfo/fetchInfoStore/types";
import { progressCaptionOf } from "@/features/fetchInfo/progressCaptionOf";
import { useT } from "@/features/i18n/useT";
import {
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { albumKeyOf } from "../../../../shared/albumKeyOf";
import { displayArtistOf } from "../../../../shared/displayArtistOf";
import { groupMusicsByAlbum } from "../../../../shared/groupMusicsByAlbum";

/** One row of the confirmation list: an album group and its size. */
export type FetchGroupRow = {
  /** Album identity key (`albumKeyOf`); the React key of the row. */
  readonly key: string;
  /** Display artist of the group; empty for the unknown artist. */
  readonly artist: string;
  /** Album title of the group; empty for the unknown album. */
  readonly album: string;
  /** Number of tracks in the group. */
  readonly count: number;
};

const EMPTY: readonly Music[] = [];

/** The tracks of the states that carry them. */
const musicsOf = (state: FetchInfoState): readonly Music[] =>
  state.status === "confirming" ||
  state.status === "running" ||
  state.status === "done"
    ? state.musics
    : EMPTY;

/** Body copy for each store state (details rendered separately). */
const description = (
  state: FetchInfoState,
  t: ReturnType<typeof useT>,
): string => {
  switch (state.status) {
    case "confirming":
      return t("fetch.dialog.count", { count: state.musics.length });
    case "running":
      return t("fetch.progress.processing", {
        current: state.progress?.current ?? 0,
        total: state.progress?.total ?? state.musics.length,
      });
    case "done":
      return state.summary.cancelled
        ? t("fetch.summary.cancelled")
        : t("fetch.summary.done");
    case "error":
      return t("fetch.dialog.failed", { message: state.error.message });
    default:
      return "";
  }
};

/**
 * Logic of `FetchInfoDialog`: the fetch store's state, the album groups of
 * the targets (the same grouping Main searches by), the playback stop
 * before a run that includes the current track, and the store commands.
 * Visibility follows the store; the dialog holds no state of its own.
 */
export const useFetchInfoDialog = () => {
  const t = useT();
  const state = useSyncExternalStore(
    fetchInfoStore.subscribe,
    fetchInfoStore.getSnapshot,
  );
  const { current } = usePlayerState();
  const commands = usePlayerCommands();

  const musics = musicsOf(state);
  // The grouping is what the confirmation lists and what the running
  // caption walks; memoised on the target identity so it is built once
  // per run rather than on every progress push.
  const groups = useMemo(() => groupMusicsByAlbum(musics), [musics]);
  const groupRows: FetchGroupRow[] = [];
  for (const group of groups) {
    const first = group[0];
    if (first === undefined) {
      continue;
    }

    const artist = displayArtistOf(first);
    groupRows.push({
      key: albumKeyOf(artist, first.album),
      artist,
      album: first.album,
      count: group.length,
    });
  }

  /** The current track is among the targets: starting stops playback. */
  const stopsPlayback =
    state.status === "confirming" &&
    current !== null &&
    state.musics.some((music) => music.id === current.id);

  const caption =
    state.status === "running"
      ? progressCaptionOf(groups, state.progress)
      : null;

  const start = (): void => {
    if (stopsPlayback) {
      commands.stop();
    }

    void fetchInfoStore.start();
  };

  const cancelFetch = (): void => {
    void fetchInfoStore.cancelFetch();
  };

  const close = (): void => {
    fetchInfoStore.close();
  };

  return {
    state,
    groupRows,
    descriptionText: description(state, t),
    stopsPlayback,
    caption,
    start,
    cancelFetch,
    close,
  };
};
