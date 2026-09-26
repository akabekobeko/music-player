import type {
  FetchMusicInfoRequest,
  FetchMusicInfoSummary,
  FetchMusicResult,
  FetchProgressPayload,
  IpcError,
  IpcResult,
  Music,
} from "@mp/ipc";
import type { AppliedUpdate } from "@/features/library/musicInfoStore";

/**
 * State machine behind the "Fetch song info" menu entries
 * (`docs/specs/v1.2/features/fetch-dialog.md`): the menu stashes its
 * target tracks here, the app-level `FetchInfoDialog` confirms them, and
 * `mp:musicbrainz:fetchMusicInfo` only runs after the user confirms. The
 * shape mirrors the import store.
 */

/** Running tally of the progress pushes, by outcome. */
export type FetchCounts = Readonly<Record<FetchMusicResult, number>>;

/** UI-facing state of the fetch entrance. */
export type FetchInfoState =
  | { readonly status: "idle" }
  | {
      /** Discriminant: the targets are listed and wait for confirmation. */
      readonly status: "confirming";
      /** Tracks the menu entry was invoked for, in list order. */
      readonly musics: readonly Music[];
    }
  | {
      /** Discriminant: `mp:musicbrainz:fetchMusicInfo` is running. */
      readonly status: "running";
      /** The confirmed tracks handed to the channel. */
      readonly musics: readonly Music[];
      /** Latest `mp:musicbrainz:fetchProgress` push, `null` before the first. */
      readonly progress: FetchProgressPayload | null;
      /** Outcomes counted from the pushes so far. */
      readonly counts: FetchCounts;
      /** Whether the user already pressed Cancel (button then disables). */
      readonly cancelRequested: boolean;
    }
  | {
      /** Discriminant: the run finished (completed or cancelled). */
      readonly status: "done";
      /** The tracks the run was started for. */
      readonly musics: readonly Music[];
      /** Final report returned by `mp:musicbrainz:fetchMusicInfo`. */
      readonly summary: FetchMusicInfoSummary;
    }
  | {
      /** Discriminant: the channel itself failed (busy, invalid request). */
      readonly status: "error";
      /** The failure returned by the channel. */
      readonly error: IpcError;
    };

/** The slice of the app the store needs (injectable for tests). */
export type FetchInfoBridge = {
  /** `mp:musicbrainz:fetchMusicInfo`: run the bulk fetch. */
  readonly fetchMusicInfo: (
    request: FetchMusicInfoRequest,
  ) => Promise<IpcResult<FetchMusicInfoSummary>>;
  /** `mp:musicbrainz:cancelFetch`: ask the running fetch to stop. */
  readonly cancelFetch: () => Promise<IpcResult<void>>;
  /**
   * Hand the tracks a run updated to the queue / current track and to the
   * views that follow a changed artist or album, the same path the music
   * info dialog's apply takes.
   */
  readonly applied: (update: AppliedUpdate) => void;
};
