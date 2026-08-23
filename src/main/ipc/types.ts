import type { AudioFormat } from "@akabeko/music-metadata-editor";
import type { LocalePreference } from "../../shared/locales/types";

/**
 * Single definition site for every type that crosses the Main / Renderer
 * boundary: domain types, per-channel Request / Response payloads, and the
 * `window.mp` bridge shape.
 *
 * Renderer references these exclusively through type-only imports (the
 * `@mp/ipc` virtual module declared in `src/renderer/vite-env.d.ts`), so the
 * only process with a value-level dependency on `src/main` is Main itself.
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
 * One track in the library. Mirrors a row of the `musics` table
 * (`docs/specs/v1.0/architecture/database.md`) in camelCase.
 */
export type Music = {
  readonly id: number;
  /** Absolute path of the audio file. Unique within the library. */
  readonly filePath: string;
  /** Audio container format (mme's `AudioFormat`, type-only import). */
  readonly audioFormat: AudioFormat;
  /** Track title; the importer fills in the file name when the tag is empty. */
  readonly title: string;
  readonly artist: string;
  readonly albumArtist: string;
  readonly album: string;
  readonly disc: number;
  readonly track: number;
  /** Release year. `null` when unknown (never 0). */
  readonly year: number | null;
  readonly genre: string;
  readonly composer: string;
  readonly lyricist: string;
  readonly producer: string;
  readonly conductor: string;
  /** Publisher / record label. */
  readonly publisher: string;
  /** Duration reported by mme; may be inaccurate for VBR MP3 without Xing. */
  readonly durationMs: number;
  readonly bpm: number | null;
  /** Normalised rating in `[0, 1]`. */
  readonly rating: number | null;
  /** Artwork reference into the `pictures` table. */
  readonly pictureId: number | null;
  /**
   * Absolute artwork path joined from `pictures.file_path`, or `null`.
   * Renderer turns this into a `media-file://` URL (PlayerBar, track lists).
   */
  readonly picturePath: string | null;
  /** ISO-8601 timestamp the track was first imported. */
  readonly addedAt: string;
  /** ISO-8601 timestamp of the last (re-)import. */
  readonly updatedAt: string;
};

/**
 * One artist row of the Artist view, grouped by the display artist
 * (`album_artist` falling back to `artist`).
 */
export type Artist = {
  readonly name: string;
  /** Number of tracks by this artist. */
  readonly musicCount: number;
  /**
   * Absolute path of the representative artwork under `userData/images/`,
   * or `null` when the artist has none. Renderer turns this into a
   * `media-file://` URL.
   */
  readonly picturePath: string | null;
};

/** One album card of the Album view (grouped by album identity key). */
export type AlbumSummary = {
  /**
   * Opaque identity key produced by Main from
   * `(COALESCE(NULLIF(album_artist, ''), artist), album)`. Pass it back to
   * `mp:library:getMusicsByAlbum` verbatim.
   */
  readonly albumKey: string;
  readonly album: string;
  /** Display artist of the album (album_artist, falling back to artist). */
  readonly artist: string;
  /** Representative release year. `null` when unknown. */
  readonly year: number | null;
  readonly genre: string;
  /** Representative producer (any non-empty value of the group). */
  readonly producer: string;
  /** Representative conductor (any non-empty value of the group). */
  readonly conductor: string;
  /** Representative publisher / record label (any non-empty value of the group). */
  readonly publisher: string;
  readonly musicCount: number;
  readonly totalDurationMs: number;
  /** Absolute path of the representative artwork, or `null`. */
  readonly picturePath: string | null;
};

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

/** Choices offered by the Album view's filter UI. */
export type FilterOptions = {
  /** Distinct genres (empty string excluded) with their album counts. */
  readonly genres: ReadonlyArray<{
    readonly name: string;
    readonly count: number;
  }>;
  /**
   * Distinct decade start years (e.g. `1990` = 1990s) that actually contain
   * tracks, ascending. Empty when no track has a year — unknown-year tracks
   * are handled by the panel's separate "Unknown" item, not this list.
   */
  readonly decades: readonly number[];
};

/** Library-wide counters shown by the settings page's library section. */
export type LibraryStats = {
  readonly musicCount: number;
  readonly artistCount: number;
  /** Number of album identity groups (album_artist ⊕ album). */
  readonly albumCount: number;
  readonly totalDurationMs: number;
};

/** Final report of one `mp:library:import` run. */
export type ImportSummary = {
  /** Number of newly inserted tracks. */
  readonly imported: number;
  /** Number of existing tracks refreshed by upsert. */
  readonly updated: number;
  /** Per-file failures; one bad file never aborts the batch. */
  readonly failed: ReadonlyArray<{
    readonly filePath: string;
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
  readonly kind: "imported" | "removed";
};

// ---------------------------------------------------------------------------
// Playlist
// ---------------------------------------------------------------------------

/** Sortable fields of a smart playlist rule. */
export type SmartSortField =
  | "title"
  | "artist"
  | "album"
  | "year"
  | "duration"
  | "rating"
  | "addedAt";

/**
 * One condition row of a smart playlist
 * (`docs/specs/v1.0/features/playlist.md`).
 */
export type SmartCondition =
  | {
      readonly field: "artist" | "albumArtist" | "album" | "genre" | "title";
      readonly operator: "is" | "isNot" | "contains";
      readonly value: string;
    }
  | {
      readonly field: "year";
      readonly operator: "is" | "between" | "gte" | "lte";
      readonly value: number;
      readonly value2?: number;
    }
  | {
      /** Normalised rating in `[0, 1]`. */
      readonly field: "rating";
      readonly operator: "gte" | "lte";
      readonly value: number;
    }
  | {
      /** Duration in seconds. */
      readonly field: "duration";
      readonly operator: "gte" | "lte";
      readonly value: number;
    }
  | {
      /** "Recently added" style condition. */
      readonly field: "addedAt";
      readonly operator: "inLastDays";
      readonly value: number;
    };

/** Rule document stored in `smart_playlists.rules` (JSON). */
export type SmartPlaylistRules = {
  readonly version: 1;
  /** How conditions combine: AND (`"all"`) or OR (`"any"`). */
  readonly match: "all" | "any";
  readonly conditions: readonly SmartCondition[];
  readonly sort?:
    | { readonly field: SmartSortField; readonly order: "asc" | "desc" }
    | { readonly field: "random" };
  /** Maximum number of tracks in the evaluated result. */
  readonly limit?: number;
};

/** Discriminates the two playlist tables. */
export type PlaylistKind = "static" | "smart";

/**
 * One playlist as listed by `mp:playlist:list`. `id` is only unique within
 * its `kind` (static and smart playlists live in separate tables).
 */
export type Playlist = {
  readonly id: number;
  readonly kind: PlaylistKind;
  readonly name: string;
  readonly sortOrder: number;
  /** Rule document; present only when `kind` is `"smart"`. */
  readonly rules?: SmartPlaylistRules;
};

/** Request payload for `mp:playlist:create`. */
export type PlaylistCreateRequest = {
  readonly kind: PlaylistKind;
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
  readonly id: number;
  readonly kind: PlaylistKind;
  readonly name?: string;
  readonly sortOrder?: number;
  readonly musicIds?: readonly number[];
  readonly rules?: SmartPlaylistRules;
};

/** Request payload for `mp:playlist:remove`. */
export type PlaylistRemoveRequest = {
  readonly id: number;
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
 * Last main view shown (section tab + its sidebar selection), restored at
 * launch. The selection is dropped at restore time when its target no longer
 * exists; the Album view's selection is `albumFilter`, persisted separately.
 */
export type LastView = {
  readonly section: ViewSection;
  /**
   * Selected artist name in the Artist view; `""` is the "Unknown Artist"
   * bucket. Unset when nothing was selected.
   */
  readonly artist?: string;
  /** Selected playlist route id (`p12` / `s3`) in the Playlist view. */
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
    readonly width: number;
    readonly height: number;
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
  readonly electron: string;
  readonly chrome: string;
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

/** Request payload for `mp:library:getMusicsByArtist`. */
export type GetMusicsByArtistRequest = {
  readonly artist: string;
};

/** Request payload for `mp:library:getMusicsByAlbum`. */
export type GetMusicsByAlbumRequest = {
  /** Identity key from {@link AlbumSummary.albumKey}. */
  readonly albumKey: string;
};

/** Request payload for `mp:playlist:getMusics`. */
export type PlaylistGetMusicsRequest = {
  readonly playlistId: number;
  readonly kind: PlaylistKind;
};

/**
 * Identifier of a native menu item routed through `mp:menu:action`.
 * Extended in Phase 7 when the application menu is fleshed out.
 */
export type MenuAction = "import" | "openSettings" | "showAbout" | "stop";

/** Payload of the `mp:menu:action` push channel. */
export type MenuActionPayload = {
  readonly action: MenuAction;
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
  readonly level: LogLevel;
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
    readonly getArtists: () => Promise<IpcResult<readonly Artist[]>>;
    readonly getMusicsByArtist: (
      request: GetMusicsByArtistRequest,
    ) => Promise<IpcResult<readonly Music[]>>;
    readonly getAlbums: (
      filter: AlbumFilter,
    ) => Promise<IpcResult<readonly AlbumSummary[]>>;
    readonly getMusicsByAlbum: (
      request: GetMusicsByAlbumRequest,
    ) => Promise<IpcResult<readonly Music[]>>;
    readonly getFilterOptions: () => Promise<IpcResult<FilterOptions>>;
    readonly getStats: () => Promise<IpcResult<LibraryStats>>;
    /** Set (or replace) an artist's representative picture. */
    readonly setArtistPicture: (
      request: SetArtistPictureRequest,
    ) => Promise<IpcResult<SetArtistPictureOk>>;
    /** Subscribe to import progress pushes. */
    readonly onImportProgress: (
      listener: (payload: ImportProgressPayload) => void,
    ) => Unsubscribe;
    /** Subscribe to library-changed pushes; views re-run their queries. */
    readonly onChanged: (
      listener: (payload: LibraryChangedPayload) => void,
    ) => Unsubscribe;
  };
  /** Static / smart playlist management. */
  readonly playlist: {
    readonly list: () => Promise<IpcResult<readonly Playlist[]>>;
    readonly create: (
      request: PlaylistCreateRequest,
    ) => Promise<IpcResult<Playlist>>;
    readonly update: (
      request: PlaylistUpdateRequest,
    ) => Promise<IpcResult<Playlist>>;
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
  /** Log-forwarding channel for Renderer `console` output. */
  readonly log: {
    readonly forward: (request: LogForwardRequest) => void;
  };
};
