import type { z } from "zod";
import type { LocalePreference } from "../../shared/locales/types";
import type { albumSummarySchema } from "../../shared/schemas/albumSummarySchema";
import type { artistSchema } from "../../shared/schemas/artistSchema";
import type { audioFormatSchema } from "../../shared/schemas/audioFormatSchema";
import type { filterOptionsSchema } from "../../shared/schemas/filterOptionsSchema";
import type { libraryStatsSchema } from "../../shared/schemas/libraryStatsSchema";
import type { musicSchema } from "../../shared/schemas/musicSchema";
import type {
  playlistKindSchema,
  playlistSchema,
} from "../../shared/schemas/playlistSchema";
import type {
  smartConditionSchema,
  smartPlaylistRulesSchema,
  smartSortFieldSchema,
} from "../../shared/schemas/smartPlaylistRulesSchema";

/**
 * Single definition site for every type that crosses the Main / Renderer
 * boundary: domain types, per-channel Request / Response payloads, and the
 * `window.mp` bridge shape.
 *
 * Renderer references these exclusively through type-only imports (the
 * `@mp/ipc` virtual module declared in `src/renderer/vite-env.d.ts`), so the
 * only process with a value-level dependency on `src/main` is Main itself.
 *
 * Domain types that mirror database rows are inferred from the zod schemas
 * in `src/shared/schemas/` (schema first, `z.infer` second): the same schema
 * that declares the type also validates the rows the queries read back. The
 * imports stay type-only so this file never carries a runtime dependency.
 */

// ---------------------------------------------------------------------------
// IpcResult
// ---------------------------------------------------------------------------

/**
 * Plain-object form of an `Error` that survives Electron's structured clone
 * across IPC. Always use this in IPC responses; never throw across the bridge.
 */
export type IpcError = {
  /** Error class name (e.g., `"Error"`, `"TypeError"`). */
  readonly name: string;
  /** Optional error code (Node-style `"ENOENT"`, DB error kind, …). */
  readonly code?: string;
  /** Human-readable error message. */
  readonly message: string;
};

/**
 * Discriminated union returned by every IPC invoke handler.
 *
 * Mirrors a Result type so Renderer code can branch on `ok` without
 * `try`/`catch` around `ipcRenderer.invoke`. The error payload uses
 * {@link IpcError}, never a raw `Error` instance, because `Error` does not
 * survive structured cloning.
 */
export type IpcResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: IpcError };

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/**
 * Deeply-readonly counterpart of `T`.
 *
 * The schema-derived domain types are made readonly here, at the type level,
 * instead of with zod's `.readonly()`: that modifier also `Object.freeze`s
 * every parsed row at runtime, a per-row cost on the hot track queries (a
 * smart playlist without conditions returns the whole library) that buys
 * nothing, since Main never mutates the rows and the freeze does not survive
 * the structured clone across IPC anyway.
 */
export type DeepReadonly<T> =
  T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

/**
 * Audio container format of a track
 * (`src/shared/schemas/audioFormatSchema.ts`); the same union as mme's
 * `AudioFormat`.
 */
export type AudioFormat = z.infer<typeof audioFormatSchema>;

/**
 * One track in the library. Mirrors a row of the `musics` table
 * (`docs/specs/v1.0/architecture/database.md`) in camelCase
 * (`src/shared/schemas/musicSchema.ts`).
 */
export type Music = DeepReadonly<z.infer<typeof musicSchema>>;

/**
 * One artist row of the Artist view, grouped by the display artist
 * (`album_artist` falling back to `artist`)
 * (`src/shared/schemas/artistSchema.ts`).
 */
export type Artist = DeepReadonly<z.infer<typeof artistSchema>>;

/**
 * One album card of the Album view (grouped by album identity key)
 * (`src/shared/schemas/albumSummarySchema.ts`).
 */
export type AlbumSummary = DeepReadonly<z.infer<typeof albumSummarySchema>>;

/**
 * Filter condition of the Album view, converted to a WHERE clause by Main.
 * Persisted in `AppSettings.albumFilter`. Kinds combine with AND; values
 * inside one kind combine with OR.
 */
export type AlbumFilter = {
  /** Case-insensitive partial match against album and artist names. */
  readonly text?: string;
  /**
   * Case-insensitive partial match against track titles — only albums
   * containing a matching track survive. Fed by the content toolbar's song
   * filter; never persisted in `AppSettings.albumFilter`.
   */
  readonly musicTitle?: string;
  /** Selected genres. */
  readonly genres?: readonly string[];
  /**
   * Selected decade start years (e.g. `1990` = 1990s). `null` selects albums
   * whose year is unknown.
   */
  readonly decades?: ReadonlyArray<number | null>;
};

/**
 * Choices offered by the Album view's filter UI
 * (`src/shared/schemas/filterOptionsSchema.ts`).
 */
export type FilterOptions = DeepReadonly<z.infer<typeof filterOptionsSchema>>;

/**
 * Library-wide counters shown by the settings page's library section
 * (`src/shared/schemas/libraryStatsSchema.ts`).
 */
export type LibraryStats = DeepReadonly<z.infer<typeof libraryStatsSchema>>;

/** Final report of one `mp:library:import` run. */
export type ImportSummary = {
  /** Number of newly inserted tracks. */
  readonly imported: number;
  /** Number of existing tracks refreshed by upsert. */
  readonly updated: number;
  /** Per-file failures; one bad file never aborts the batch. */
  readonly failed: ReadonlyArray<{
    /** Path of the file that failed, as handed to the metadata reader. */
    readonly filePath: string;
    /** Why it failed (extraction or DB upsert), serialised for IPC. */
    readonly error: IpcError;
  }>;
};

/** Lifecycle stage reported by `mp:library:importProgress`. */
export type ImportPhase = "enumerating" | "importing";

/**
 * Payload of the `mp:library:importProgress` push channel.
 *
 * Emitted every 100 files and on phase changes while an import runs
 * (implemented in Phase 2).
 */
export type ImportProgressPayload = {
  /**
   * Current stage. One `"enumerating"` push with every counter at zero goes
   * out while the paths are expanded; `"importing"` pushes follow, once
   * before the first batch and once after each batch.
   */
  readonly phase: ImportPhase;
  /** Number of files processed so far in this phase. */
  readonly current: number;
  /** Total number of files in this phase. */
  readonly total: number;
  /** File currently being processed. */
  readonly filePath: string;
  /** Number of failures accumulated so far. */
  readonly errors: number;
};

/** Payload of the `mp:library:changed` push channel. */
export type LibraryChangedPayload = {
  /**
   * What changed: `"imported"` after an import that inserted or refreshed
   * tracks, `"removed"` after a track / artist / album removal, `"updated"`
   * after `mp:library:updateMusics` rewrote at least one file. Only sent
   * when something actually changed. The Renderer currently invalidates
   * every library query regardless of the kind.
   */
  readonly kind: "imported" | "removed" | "updated";
};

/**
 * Tag fields the music info dialog can write back
 * (`docs/specs/v1.1/architecture/ipc-types.md`). Only the fields to change
 * are present; an absent field leaves the file and the DB untouched.
 *
 * An empty string clears a text tag. `title` must never be empty — the
 * Renderer's validation rejects it before the request is built.
 */
export type MusicTagPatch = {
  /** Track title; never empty (the dialog rejects it), so never cleared. */
  readonly title?: string;
  /** Track artist; `""` clears the tag. */
  readonly artist?: string;
  /**
   * Album artist; `""` clears the tag, after which the display artist
   * falls back to `artist`.
   */
  readonly albumArtist?: string;
  /** Album title; `""` clears the tag. */
  readonly album?: string;
  /** Genre; `""` clears the tag. */
  readonly genre?: string;
  /** Composer; `""` clears the tag. */
  readonly composer?: string;
  /** Lyricist; `""` clears the tag. */
  readonly lyricist?: string;
  /** Producer; `""` clears the tag. */
  readonly producer?: string;
  /** Conductor; `""` clears the tag. */
  readonly conductor?: string;
  /** Publisher / record label; `""` clears the tag. */
  readonly publisher?: string;
  /** `null` clears the tag. */
  readonly year?: number | null;
  /**
   * Track number. Cannot be cleared: the dialog sends the DB default `0`
   * for an empty input.
   */
  readonly track?: number;
  /**
   * Disc number. Cannot be cleared: the dialog sends the DB default `1`
   * for an empty input.
   */
  readonly disc?: number;
  /** `null` clears the tag. */
  readonly bpm?: number | null;
  /** Normalised rating in `[0, 1]`; `null` clears the tag. */
  readonly rating?: number | null;
};

/** Front cover to embed through {@link UpdateMusicsRequest.picture}. */
export type MusicPictureInput = {
  /** MIME type of the image (`"image/jpeg"`, `"image/png"`, …). */
  readonly mimeType: string;
  /** Raw image bytes read from the user-selected file. */
  readonly data: Uint8Array;
};

/** Request payload for `mp:library:updateMusics`. */
export type UpdateMusicsRequest = {
  /** Tracks to update; must be non-empty and free of duplicates. */
  readonly musicIds: readonly number[];
  /** Only the fields to change; absent fields are left as they are. */
  readonly patch: MusicTagPatch;
  /**
   * Front cover to embed, `null` to remove the artwork, or absent to leave
   * it untouched. Bytes travel like `mp:library:setArtistPicture`.
   */
  readonly picture?: MusicPictureInput | null;
};

/** One successfully updated track of {@link UpdateMusicsSummary}. */
export type UpdatedMusic = {
  /** The track as re-read from the file after the write. */
  readonly music: Music;
  /** Display artist after the update (album_artist, falling back to artist). */
  readonly displayArtist: string;
  /** Album identity key after the update (same as {@link AlbumSummary.albumKey}). */
  readonly albumKey: string;
};

/**
 * Final report of one `mp:library:updateMusics` run. One failed file never
 * aborts the batch — it lands in `failed` while the rest is applied.
 */
export type UpdateMusicsSummary = {
  /** Tracks whose file was rewritten, in request order. */
  readonly updated: readonly UpdatedMusic[];
  /**
   * Per-file failures (write, re-read, or DB upsert); the music info dialog
   * lists them by file name.
   */
  readonly failed: ReadonlyArray<{
    /** `Music.id` of the track that failed. */
    readonly musicId: number;
    /** Path of the file that failed, as stored in the library. */
    readonly filePath: string;
    /** Why it failed, serialised for IPC. */
    readonly error: IpcError;
  }>;
};

/**
 * Payload of the `mp:library:updateProgress` push channel. Emitted once per
 * file after it was processed (successfully or not).
 */
export type UpdateProgressPayload = {
  /** Number of files processed so far. */
  readonly current: number;
  /** Total number of files in this run. */
  readonly total: number;
  /** File just processed. */
  readonly filePath: string;
};

// ---------------------------------------------------------------------------
// MusicBrainz
// ---------------------------------------------------------------------------

/**
 * Tags MusicBrainz can supply for one track
 * (`docs/specs/v1.2/architecture/ipc-types.md`). The subset of
 * {@link MusicTagPatch} without bpm / rating (MusicBrainz has neither), with
 * `null` meaning "MusicBrainz has no value", as opposed to the empty string
 * of a patch, which clears a tag. Values follow
 * `docs/specs/v1.2/architecture/metadata-mapping.md`.
 */
export type MusicInfoCandidateTags = {
  /** Track title as printed on the release, falling back to the recording title. */
  readonly title: string | null;
  /** Track artist credit joined with its join phrases (`A feat. B`). */
  readonly artist: string | null;
  /** Release artist credit joined the same way; `Various Artists` as is. */
  readonly albumArtist: string | null;
  /** Release title. */
  readonly album: string | null;
  /**
   * Most voted genre of the release group, then the release, then the
   * recording; first letter capitalised.
   */
  readonly genre: string | null;
  /** First four digits of the release date, then of the group's first release date. */
  readonly year: number | null;
  /** Track position within its medium (1-based). */
  readonly track: number | null;
  /** Medium position within the release (1-based). */
  readonly disc: number | null;
  /** Composers of the performed works, joined with `, `. */
  readonly composer: string | null;
  /** Lyricists of the performed works, joined with `, `. */
  readonly lyricist: string | null;
  /** Producers related to the recording, joined with `, `. */
  readonly producer: string | null;
  /** Conductors related to the recording, joined with `, `. */
  readonly conductor: string | null;
  /** Name of the first label of the release. */
  readonly publisher: string | null;
};

/**
 * One track's worth of information looked up from MusicBrainz
 * (`docs/specs/v1.2/architecture/ipc-types.md`). Returned by
 * `mp:musicbrainz:lookupMusic` and consumed by the bulk fetch; the MBIDs are
 * never stored in the library (`docs/specs/v1.2/scope.md`).
 */
export type MusicInfoCandidate = {
  /** MBID of the matched recording; for the completion report and logs. */
  readonly recordingId: string;
  /** MBID of the release the tags were taken from; the Cover Art Archive key. */
  readonly releaseId: string;
  /** Lucene search score (0 to 100) of the hit that led to the release. */
  readonly score: number;
  /** The tag values; `null` where MusicBrainz has none. */
  readonly tags: MusicInfoCandidateTags;
  /**
   * Front cover from the Cover Art Archive, or `null` when none exists.
   * Temporary bytes: persisted only when the user adopts them.
   */
  readonly picture: MusicPictureInput | null;
};

/** Request payload for `mp:musicbrainz:lookupMusic`. */
export type LookupMusicRequest = {
  /** `Music.id` of the track shown in the music info dialog. */
  readonly musicId: number;
};

/** Request payload for `mp:musicbrainz:fetchMusicInfo`. */
export type FetchMusicInfoRequest = {
  /**
   * Tracks to complete, in the order the confirmation dialog lists them;
   * must be non-empty and free of duplicates. Main groups them by album
   * identity in first-appearance order.
   */
  readonly musicIds: readonly number[];
};

/** Outcome of one track of a bulk fetch (`FetchProgressPayload.result`). */
export type FetchMusicResult = "updated" | "unchanged" | "notFound" | "failed";

/**
 * Payload of the `mp:musicbrainz:fetchProgress` push channel
 * (`docs/specs/v1.2/architecture/ipc.md`). Emitted once per track after it
 * was processed; `current` does not advance while an album group is being
 * searched, so the Renderer shows the searched album instead.
 */
export type FetchProgressPayload = {
  /** Number of tracks processed so far. */
  readonly current: number;
  /** Total number of tracks in this run. */
  readonly total: number;
  /** File of the track just processed. */
  readonly filePath: string;
  /** How that track ended up. */
  readonly result: FetchMusicResult;
};

/**
 * Final report of one `mp:musicbrainz:fetchMusicInfo` run
 * (`docs/specs/v1.2/architecture/fetch-run.md`). Without a cancellation,
 * the four lists add up to the request size.
 */
export type FetchMusicInfoSummary = {
  /** Tracks that got at least one tag or the artwork written. */
  readonly updated: readonly UpdatedMusic[];
  /**
   * Tracks that had a candidate but nothing missing, or whose missing
   * fields MusicBrainz has no value for either.
   */
  readonly unchanged: ReadonlyArray<{
    /** `Music.id` of the track. */
    readonly musicId: number;
    /** Path of the file, as stored in the library. */
    readonly filePath: string;
  }>;
  /** Tracks the search found no match for. */
  readonly notFound: ReadonlyArray<{
    /** `Music.id` of the track. */
    readonly musicId: number;
    /** Path of the file, as stored in the library. */
    readonly filePath: string;
  }>;
  /** Tracks that failed to look up or to write; one never aborts the run. */
  readonly failed: ReadonlyArray<{
    /** `Music.id` of the track. */
    readonly musicId: number;
    /** Path of the file, as stored in the library. */
    readonly filePath: string;
    /** Why it failed (a MusicBrainz code or a write error), serialised. */
    readonly error: IpcError;
  }>;
  /** Whether the run was cut short by `mp:musicbrainz:cancelFetch`. */
  readonly cancelled: boolean;
};

// ---------------------------------------------------------------------------
// Playlist
// ---------------------------------------------------------------------------

/**
 * Sortable fields of a smart playlist rule
 * (`src/shared/schemas/smartPlaylistRulesSchema.ts`).
 */
export type SmartSortField = z.infer<typeof smartSortFieldSchema>;

/**
 * One condition row of a smart playlist
 * (`docs/specs/v1.0/features/playlist.md`,
 * `src/shared/schemas/smartPlaylistRulesSchema.ts`).
 */
export type SmartCondition = DeepReadonly<z.infer<typeof smartConditionSchema>>;

/**
 * Rule document stored in `smart_playlists.rules` (JSON)
 * (`src/shared/schemas/smartPlaylistRulesSchema.ts`).
 */
export type SmartPlaylistRules = DeepReadonly<
  z.infer<typeof smartPlaylistRulesSchema>
>;

/**
 * Discriminates the two playlist tables
 * (`src/shared/schemas/playlistSchema.ts`).
 */
export type PlaylistKind = z.infer<typeof playlistKindSchema>;

/**
 * One playlist as listed by `mp:playlist:list`. `id` is only unique within
 * its `kind` (static and smart playlists live in separate tables)
 * (`src/shared/schemas/playlistSchema.ts`).
 */
export type Playlist = DeepReadonly<z.infer<typeof playlistSchema>>;

/** Request payload for `mp:playlist:create`. */
export type PlaylistCreateRequest = {
  /** Which table to create the playlist in. */
  readonly kind: PlaylistKind;
  /** Display name, stored as is; not required to be unique. */
  readonly name: string;
  /** Required when `kind` is `"smart"`. */
  readonly rules?: SmartPlaylistRules;
};

/**
 * Request payload for `mp:playlist:update`. Omitted fields keep their
 * current value; `musicIds` replaces the full track order of a static
 * playlist wholesale.
 */
export type PlaylistUpdateRequest = {
  /** Row id within the table of `kind`; an unknown id fails the request. */
  readonly id: number;
  /** Which table the playlist lives in; also decides which fields apply. */
  readonly kind: PlaylistKind;
  /** New display name; omitted keeps the current one. */
  readonly name?: string;
  /**
   * New position within the kind's list; omitted keeps the current one.
   * Accepted by Main, but no Renderer caller sets it yet.
   */
  readonly sortOrder?: number;
  /**
   * Full new track order of a static playlist (position is the identity,
   * duplicates allowed); omitted keeps the current one. Ignored for smart
   * playlists.
   */
  readonly musicIds?: readonly number[];
  /**
   * New rule document of a smart playlist, validated by Main before it is
   * stored; omitted keeps the current one. Ignored for static playlists.
   */
  readonly rules?: SmartPlaylistRules;
};

/** Request payload for `mp:playlist:remove`. */
export type PlaylistRemoveRequest = {
  /** Row id within the table of `kind`; an unknown id fails the request. */
  readonly id: number;
  /** Which table the playlist lives in. */
  readonly kind: PlaylistKind;
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** Color theme preference persisted in `AppSettings.theme`. */
export type ThemePreference = "light" | "dark" | "system";

/** Top-level sidebar section of the renderer's main views. */
export type ViewSection = "artists" | "albums" | "playlists";

/**
 * Last main view shown (the section tab) plus each section's last sidebar
 * selection, so switching tabs and relaunching both return to where the
 * user was. A selection is dropped at restore time when its target no
 * longer exists; the Album view's selection is `albumFilter`, persisted
 * separately.
 */
export type LastView = {
  /** Section tab that was shown last; the one to open on next launch. */
  readonly section: ViewSection;
  /**
   * Last selected artist name in the Artist view; `""` is the "Unknown
   * Artist" bucket. Unset when nothing was selected.
   */
  readonly artist?: string;
  /** Last selected playlist route id (`p12` / `s3`) in the Playlist view. */
  readonly playlist?: string;
};

/**
 * Persisted user preferences. Lives in `<userData>/settings.json`; only Main
 * touches the file directly
 * (`docs/specs/v1.0/architecture/process-model.md`).
 */
export type AppSettings = {
  /** Schema generation; bump to enable a future migration step. */
  readonly version: 1;
  /** Last-known window geometry — restored at app launch. */
  readonly window: {
    /** Window x position; unset on first launch (OS decides). */
    readonly x?: number;
    /** Window y position; unset on first launch (OS decides). */
    readonly y?: number;
    /**
     * Window width in pixels, taken from the normal (un-maximized) bounds.
     * Defaults to 900.
     */
    readonly width: number;
    /**
     * Window height in pixels, taken from the normal (un-maximized) bounds.
     * Defaults to 670.
     */
    readonly height: number;
    /**
     * Whether the window was maximized; the window is created with the
     * normal bounds and then maximized. Defaults to `false`.
     */
    readonly maximized: boolean;
  };
  /** UI language. Unset (or `"system"`) follows `app.getLocale()`. */
  readonly locale?: LocalePreference;
  /** Color theme. Unset (or `"system"`) follows `prefers-color-scheme`. */
  readonly theme?: ThemePreference;
  /** Album view filter, restored on next launch. */
  readonly albumFilter?: AlbumFilter;
  /** Sidebar layout state, restored on next launch. */
  readonly sidebar?: {
    /** Whether the sidebar column is visible. */
    readonly open: boolean;
    /** Sidebar column width in pixels. */
    readonly width: number;
  };
  /**
   * Last path picked in the import target dialog, restored as its
   * `defaultPath` (app-own history — never the OS-shared one). May no longer
   * exist; the dialog opener climbs to the nearest existing ancestor.
   */
  readonly importDialogPath?: string;
  /** Last main view (section + sidebar selection), restored on next launch. */
  readonly lastView?: LastView;
};

/**
 * Deeply-partial counterpart of `T`.
 *
 * Used for `mp:settings:set` patches so callers can update a single nested
 * key without echoing the rest of the tree back. Arrays inside a patch
 * replace wholesale; Main merges with an explicit-field strategy (never a
 * generic deep merge — structural guard against prototype pollution).
 */
export type DeepPartial<T> =
  T extends ReadonlyArray<infer U>
    ? ReadonlyArray<U>
    : T extends object
      ? { readonly [K in keyof T]?: DeepPartial<T[K]> }
      : T;

/** Request payload for `mp:settings:set`. */
export type SetSettingsRequest = {
  /** Deeply-partial settings patch. */
  readonly patch: DeepPartial<AppSettings>;
};

// ---------------------------------------------------------------------------
// App / dialog / dnd / menu / log
// ---------------------------------------------------------------------------

/** Runtime versions reported by `mp:app:getVersions` (about dialog). */
export type Versions = {
  /** The app's own `package.json` version. */
  readonly app: string;
  /** Electron version (`process.versions.electron`, `""` if missing). */
  readonly electron: string;
  /** Chromium version (`process.versions.chrome`, `""` if missing). */
  readonly chrome: string;
  /** Node.js version (`process.versions.node`). */
  readonly node: string;
};

/** Successful payload of `mp:dialog:openImportTargets`. */
export type OpenImportTargetsOk = {
  /** Selected file / directory paths; empty when the dialog was cancelled. */
  readonly paths: readonly string[];
};

/** Request payload for `mp:dnd:expandPaths`. */
export type ExpandPathsRequest = {
  /** Mix of file and directory paths — directories are walked recursively. */
  readonly paths: readonly string[];
};

/** Successful payload of `mp:dnd:expandPaths`. */
export type ExpandPathsOk = {
  /** Audio file paths that survived recursion + extension filtering. */
  readonly files: readonly string[];
};

/** Request payload for `mp:library:import`. */
export type ImportMusicsRequest = {
  /** File / directory paths to import. */
  readonly paths: readonly string[];
};

/** Request payload for `mp:library:removeMusics`. */
export type RemoveMusicsRequest = {
  /**
   * `Music.id` values to remove. Ids not in the library are silently
   * ignored; an empty list is a no-op and broadcasts nothing.
   */
  readonly musicIds: readonly number[];
};

/** Request payload for `mp:library:removeArtist`. */
export type RemoveArtistRequest = {
  /**
   * Display-artist name (`album_artist` falling back to `artist`); the
   * empty string is the unknown bucket.
   */
  readonly artist: string;
};

/** Request payload for `mp:library:removeAlbum`. */
export type RemoveAlbumRequest = {
  /** Identity key from {@link AlbumSummary.albumKey} / `AlbumGroup.key`. */
  readonly albumKey: string;
};

/** Request payload for `mp:library:setArtistPicture`. */
export type SetArtistPictureRequest = {
  /** Display-artist name (the artist list's entry); must not be empty. */
  readonly artist: string;
  /** MIME type of the image (`"image/jpeg"`, `"image/png"`, …). */
  readonly mimeType: string;
  /** Raw image bytes read from the user-selected file. */
  readonly data: Uint8Array;
};

/** Successful payload of `mp:library:setArtistPicture`. */
export type SetArtistPictureOk = {
  /** Absolute path of the stored image under `userData/images/`. */
  readonly picturePath: string;
};

/** Request payload for `mp:library:setArtistInitial`. */
export type SetArtistInitialRequest = {
  /** Display-artist name (the artist list's entry); must not be empty. */
  readonly artist: string;
  /** Capital letter A–Z to store, or `null` to clear the choice ("Other"). */
  readonly initial: string | null;
};

/** Request payload for `mp:library:getMusicsByArtist`. */
export type GetMusicsByArtistRequest = {
  /**
   * Display-artist name (`album_artist` falling back to `artist`), exactly
   * as listed by `mp:library:getArtists`; the empty string is the unknown
   * bucket.
   */
  readonly artist: string;
};

/** Request payload for `mp:library:getMusicsByAlbum`. */
export type GetMusicsByAlbumRequest = {
  /** Identity key from {@link AlbumSummary.albumKey}. */
  readonly albumKey: string;
};

/** Request payload for `mp:playlist:getMusics`. */
export type PlaylistGetMusicsRequest = {
  /** Row id within the table of `kind`; an unknown id fails the request. */
  readonly playlistId: number;
  /** Which table the playlist lives in. */
  readonly kind: PlaylistKind;
};

/**
 * Identifier of a native menu item routed through `mp:menu:action`.
 * Extended in Phase 7 when the application menu is fleshed out.
 */
export type MenuAction = "import" | "openSettings" | "showAbout" | "stop";

/** Payload of the `mp:menu:action` push channel. */
export type MenuActionPayload = {
  /** The menu item that was activated. */
  readonly action: MenuAction;
};

/**
 * Payload of the `mp:window:fullScreenChanged` push channel. Sent when the
 * window enters / leaves full screen and once per page load with the current
 * state, so a reload while in full screen still starts out right.
 */
export type WindowFullScreenChangedPayload = {
  /** Whether the window is in full-screen mode. */
  readonly fullScreen: boolean;
};

/**
 * Snapshot of menu-relevant state pushed by the Renderer through
 * `mp:menu:setState` so Main can enable / disable items.
 */
export type MenuStateSnapshot = {
  /** Whether playback is running — gates playback-related items. */
  readonly isPlaying: boolean;
  /** Whether a current track is loaded — gates Stop. */
  readonly hasTrack: boolean;
};

/**
 * Request payload for `mp:menu:popup` — open the application menu as a
 * dropdown at the given position (Windows / Linux menu button,
 * `docs/specs/v1.0/cross-platform/system-menu.md`).
 */
export type MenuPopupRequest = {
  /** Popup x position in CSS pixels, relative to the web contents. */
  readonly x: number;
  /** Popup y position in CSS pixels, relative to the web contents. */
  readonly y: number;
};

/**
 * Severity of a `mp:log:forward` entry. Mirrors the subset of `console`
 * methods Renderer is allowed to forward.
 */
export type LogLevel = "info" | "warn" | "error";

/** Request payload for `mp:log:forward`. */
export type LogForwardRequest = {
  /** Severity, i.e. the `console` method the entry came from. */
  readonly level: LogLevel;
  /** The log text. */
  readonly message: string;
  /** Optional auxiliary detail (Error stack, JSON snippet, …). */
  readonly detail?: string;
};

// ---------------------------------------------------------------------------
// Bridge
// ---------------------------------------------------------------------------

/**
 * Unsubscribe function returned by every push-channel subscriber. Calling it
 * detaches the listener; app-lifetime subscriptions are registered in the
 * bootstrap, component-lifetime ones from `useSyncExternalStore`.
 */
export type Unsubscribe = () => void;

/**
 * The shape of `window.mp`, exposed via `contextBridge.exposeInMainWorld`.
 *
 * Grouped by resource (`app` / `dialog` / `library` / …) to keep call sites
 * readable. Preload implements the wiring; Main implements the handlers.
 * Handlers for channels beyond `app.getVersions` land in Phase 2+.
 */
export type MpBridge = {
  /** App-level metadata channels. */
  readonly app: {
    /** Resolve the runtime {@link Versions} report. */
    readonly getVersions: () => Promise<IpcResult<Versions>>;
  };
  /** Native dialog wrappers. */
  readonly dialog: {
    /** Show the file / folder picker for library import. */
    readonly openImportTargets: () => Promise<IpcResult<OpenImportTargetsOk>>;
  };
  /** Drag-and-drop helpers. */
  readonly dnd: {
    /** Recursively resolve dropped paths to audio file paths. */
    readonly expandPaths: (
      request: ExpandPathsRequest,
    ) => Promise<IpcResult<ExpandPathsOk>>;
    /**
     * Resolve the absolute filesystem path of a `File` produced by HTML drag
     * & drop. Wraps Electron's `webUtils.getPathForFile`, the only supported
     * way to get a path since `File.path` was removed.
     */
    readonly pathFor: (file: File) => string;
  };
  /** Library queries and import channels. */
  readonly library: {
    /** Run an import; progress arrives via {@link MpBridge.library.onImportProgress}. */
    readonly import: (
      request: ImportMusicsRequest,
    ) => Promise<IpcResult<ImportSummary>>;
    /** Request cancellation of the running import (file-boundary check). */
    readonly cancelImport: () => Promise<IpcResult<void>>;
    /** Remove tracks from the library (files on disk are kept). */
    readonly removeMusics: (
      request: RemoveMusicsRequest,
    ) => Promise<IpcResult<void>>;
    /** Remove every track of one artist from the library. */
    readonly removeArtist: (
      request: RemoveArtistRequest,
    ) => Promise<IpcResult<void>>;
    /** Remove every track of one album from the library. */
    readonly removeAlbum: (
      request: RemoveAlbumRequest,
    ) => Promise<IpcResult<void>>;
    /** List every display artist with its track count and picture. */
    readonly getArtists: () => Promise<IpcResult<readonly Artist[]>>;
    /** Every track of one display artist, in a stable base order. */
    readonly getMusicsByArtist: (
      request: GetMusicsByArtistRequest,
    ) => Promise<IpcResult<readonly Music[]>>;
    /** Album cards matching the filter (Album view). */
    readonly getAlbums: (
      filter: AlbumFilter,
    ) => Promise<IpcResult<readonly AlbumSummary[]>>;
    /** Every track of one album, by its identity key. */
    readonly getMusicsByAlbum: (
      request: GetMusicsByAlbumRequest,
    ) => Promise<IpcResult<readonly Music[]>>;
    /** Choices for the Album view's filter UI. */
    readonly getFilterOptions: () => Promise<IpcResult<FilterOptions>>;
    /** Library-wide counters for the settings page. */
    readonly getStats: () => Promise<IpcResult<LibraryStats>>;
    /** Set (or replace) an artist's representative picture. */
    readonly setArtistPicture: (
      request: SetArtistPictureRequest,
    ) => Promise<IpcResult<SetArtistPictureOk>>;
    /** Set or clear an artist's user-chosen initial. */
    readonly setArtistInitial: (
      request: SetArtistInitialRequest,
    ) => Promise<IpcResult<void>>;
    /**
     * Write the same tag / artwork change to several tracks; progress
     * arrives via {@link MpBridge.library.onUpdateProgress}.
     */
    readonly updateMusics: (
      request: UpdateMusicsRequest,
    ) => Promise<IpcResult<UpdateMusicsSummary>>;
    /** Subscribe to import progress pushes. */
    readonly onImportProgress: (
      listener: (payload: ImportProgressPayload) => void,
    ) => Unsubscribe;
    /** Subscribe to update progress pushes. */
    readonly onUpdateProgress: (
      listener: (payload: UpdateProgressPayload) => void,
    ) => Unsubscribe;
    /** Subscribe to library-changed pushes; views re-run their queries. */
    readonly onChanged: (
      listener: (payload: LibraryChangedPayload) => void,
    ) => Unsubscribe;
  };
  /** MusicBrainz lookups (`docs/specs/v1.2/architecture/ipc.md`). */
  readonly musicbrainz: {
    /**
     * Look up one track's candidate for the music info dialog. `null` when
     * MusicBrainz has no match; `ok: false` for an unknown id or a failed
     * request.
     */
    readonly lookupMusic: (
      request: LookupMusicRequest,
    ) => Promise<IpcResult<MusicInfoCandidate | null>>;
    /**
     * Complete the missing tags / artwork of tracks from MusicBrainz;
     * progress arrives via {@link MpBridge.musicbrainz.onFetchProgress}.
     */
    readonly fetchMusicInfo: (
      request: FetchMusicInfoRequest,
    ) => Promise<IpcResult<FetchMusicInfoSummary>>;
    /** Request cancellation of the running bulk fetch (track-boundary check). */
    readonly cancelFetch: () => Promise<IpcResult<void>>;
    /** Subscribe to bulk fetch progress pushes. */
    readonly onFetchProgress: (
      listener: (payload: FetchProgressPayload) => void,
    ) => Unsubscribe;
  };
  /** Static / smart playlist management. */
  readonly playlist: {
    /** List every playlist of both kinds (static first). */
    readonly list: () => Promise<IpcResult<readonly Playlist[]>>;
    /** Create a playlist at the end of its kind's order; returns it. */
    readonly create: (
      request: PlaylistCreateRequest,
    ) => Promise<IpcResult<Playlist>>;
    /** Apply a partial update; returns the playlist as stored afterwards. */
    readonly update: (
      request: PlaylistUpdateRequest,
    ) => Promise<IpcResult<Playlist>>;
    /** Delete a playlist (a static one drops its track entries too). */
    readonly remove: (
      request: PlaylistRemoveRequest,
    ) => Promise<IpcResult<void>>;
    /** Resolve playlist contents; smart playlists evaluate their rules. */
    readonly getMusics: (
      request: PlaylistGetMusicsRequest,
    ) => Promise<IpcResult<readonly Music[]>>;
  };
  /** Persisted-settings channels. */
  readonly settings: {
    /** Read the settings currently in effect (Main's in-memory snapshot). */
    readonly get: () => Promise<IpcResult<AppSettings>>;
    /**
     * Apply a patch and return the merged snapshot — the response is the
     * single source of truth the Renderer overwrites its state with.
     */
    readonly set: (
      request: SetSettingsRequest,
    ) => Promise<IpcResult<AppSettings>>;
  };
  /** Native application-menu channels. */
  readonly menu: {
    /** Subscribe to menu-action events fired by Main. */
    readonly onAction: (
      listener: (payload: MenuActionPayload) => void,
    ) => Unsubscribe;
    /** Push the latest menu-relevant state so Main can rebuild the menu. */
    readonly setState: (snapshot: MenuStateSnapshot) => void;
    /** Open the application menu as a dropdown (Windows / Linux). */
    readonly popup: (request: MenuPopupRequest) => void;
  };
  /** Window state channels (cosmetic layout only). */
  readonly window: {
    /** Subscribe to full-screen enter / leave notifications from Main. */
    readonly onFullScreenChanged: (
      listener: (payload: WindowFullScreenChangedPayload) => void,
    ) => Unsubscribe;
  };
  /** Log-forwarding channel for Renderer `console` output. */
  readonly log: {
    /**
     * Fire-and-forget send of one log entry to Main. Only the preload wiring
     * exists so far: Main registers no listener for the channel and no
     * Renderer code calls this yet.
     */
    readonly forward: (request: LogForwardRequest) => void;
  };
};
