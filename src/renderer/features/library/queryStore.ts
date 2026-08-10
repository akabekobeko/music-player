import type { AlbumFilter, IpcError, IpcResult } from "@mp/ipc";

/**
 * Query store skeleton (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * A React-free cache of Main query results keyed by string. Components read
 * it through `useSyncExternalStore`, so the whole app shares one mental
 * model with the audio engine: external state is `subscribe` / `getSnapshot`.
 *
 * Rules encoded here:
 * - `getSnapshot` is pure — it never starts a fetch.
 * - Fetches start on the first `subscribe` of a key and on invalidation.
 * - Invalidation refetches keys that still have subscribers and simply drops
 *   the cache for keys that do not.
 * - Losing the last subscriber KEEPS the cache. `useSyncExternalStore`
 *   re-subscribes whenever its subscribe identity changes (StrictMode,
 *   inline arrows), and dropping the entry in that window would restart the
 *   fetch and oscillate between loading and success forever.
 * - Every applied response passes a generation check, so a response that
 *   crossed an invalidation is discarded instead of overwriting fresh data.
 */

/** Result of one query as seen by the UI. Errors are shown, never swallowed. */
export type FetchState<T> =
  | { readonly status: "loading" }
  | { readonly status: "success"; readonly value: T }
  | { readonly status: "error"; readonly error: IpcError };

/** Cache key. Convention: `"artists"`, `"musicsByArtist:<name>"`, … */
export type QueryKey = string;

/** Resolves a key to its Main query. Injected so tests never touch IPC. */
export type QueryFetcher = (key: QueryKey) => Promise<IpcResult<unknown>>;

/** Store interface returned by {@link createQueryStore}. */
export type QueryStore = {
  /**
   * Register a listener for one key, starting the fetch if this is the key's
   * first subscriber.
   *
   * @param key - Query key to observe.
   * @param listener - Called whenever the key's snapshot is replaced.
   * @returns Unsubscribe function; the last unsubscribe drops the cache entry.
   */
  readonly subscribe: (key: QueryKey, listener: () => void) => () => void;
  /**
   * Read the current snapshot for a key. Pure: no fetch is started.
   *
   * @param key - Query key to read.
   * @returns The cached state, or the stable loading state when absent.
   */
  readonly getSnapshot: <T>(key: QueryKey) => FetchState<T>;
  /**
   * Discard cached results. Subscribed keys refetch; idle keys are dropped.
   *
   * @param key - Single key to invalidate, or omit for the whole store.
   */
  readonly invalidate: (key?: QueryKey) => void;
};

type Entry = {
  state: FetchState<unknown>;
  /** Bumped by invalidation; stale responses fail the equality check. */
  generation: number;
  listeners: Set<() => void>;
};

/** Stable snapshot for unknown keys (`useSyncExternalStore` needs identity). */
const LOADING: FetchState<never> = { status: "loading" };

/**
 * Build a query store around a fetcher.
 *
 * @param fetch - Key → Main query resolver.
 * @returns The store.
 */
export const createQueryStore = (fetch: QueryFetcher): QueryStore => {
  const entries = new Map<QueryKey, Entry>();

  const start = (key: QueryKey, entry: Entry): void => {
    const generation = entry.generation;
    const apply = (state: FetchState<unknown>): void => {
      const current = entries.get(key);
      if (current !== entry || current.generation !== generation) {
        return; // Invalidated (or dropped) while in flight — discard.
      }

      current.state = state;
      for (const listener of [...current.listeners]) {
        listener();
      }
    };

    fetch(key).then(
      (result) => {
        apply(
          result.ok
            ? { status: "success", value: result.value }
            : { status: "error", error: result.error },
        );
      },
      // A rejected invoke (e.g. no handler registered) must surface as an
      // error state — without this the key would sit in "loading" forever.
      (reason: unknown) => {
        apply({
          status: "error",
          error:
            reason instanceof Error
              ? { name: reason.name, message: reason.message }
              : { name: "Error", message: String(reason) },
        });
      },
    );
  };

  return {
    subscribe: (key, listener) => {
      let entry = entries.get(key);
      if (entry === undefined) {
        entry = { state: LOADING, generation: 0, listeners: new Set() };
        entries.set(key, entry);
        start(key, entry);
      }

      entry.listeners.add(listener);
      return () => {
        // Cache survives the last unsubscribe; idle entries are reclaimed
        // by the next invalidation (see module docs).
        entry.listeners.delete(listener);
      };
    },
    getSnapshot: <T>(key: QueryKey): FetchState<T> =>
      (entries.get(key)?.state ?? LOADING) as FetchState<T>,
    invalidate: (key) => {
      const targets =
        key === undefined ? [...entries.keys()] : entries.has(key) ? [key] : [];
      for (const target of targets) {
        const entry = entries.get(target);
        if (entry === undefined) {
          continue;
        }

        if (entry.listeners.size === 0) {
          entries.delete(target);
          continue;
        }

        entry.generation += 1;
        entry.state = LOADING;
        for (const listener of [...entry.listeners]) {
          listener();
        }

        start(target, entry);
      }
    },
  };
};

/**
 * Map a {@link QueryKey} to its `window.mp.library` call.
 *
 * Extended as views land in later phases (albums, filter options, …).
 *
 * @param key - Query key to resolve.
 * @returns The pending IPC result.
 */
const fetchLibraryQuery: QueryFetcher = (key) => {
  if (key === "artists") {
    return window.mp.library.getArtists();
  }

  if (key === "filterOptions") {
    return window.mp.library.getFilterOptions();
  }

  if (key === "stats") {
    return window.mp.library.getStats();
  }

  const byArtistPrefix = "musicsByArtist:";
  if (key.startsWith(byArtistPrefix)) {
    return window.mp.library.getMusicsByArtist({
      artist: key.slice(byArtistPrefix.length),
    });
  }

  const albumsPrefix = "albums:";
  if (key.startsWith(albumsPrefix)) {
    return window.mp.library.getAlbums(
      JSON.parse(key.slice(albumsPrefix.length)) as AlbumFilter,
    );
  }

  const byAlbumPrefix = "musicsByAlbum:";
  if (key.startsWith(byAlbumPrefix)) {
    return window.mp.library.getMusicsByAlbum({
      albumKey: key.slice(byAlbumPrefix.length),
    });
  }

  if (key === "playlists") {
    return window.mp.playlist.list();
  }

  const byPlaylistPrefix = "musicsByPlaylist:";
  if (key.startsWith(byPlaylistPrefix)) {
    const id = key.slice(byPlaylistPrefix.length);
    return window.mp.playlist.getMusics({
      playlistId: Number(id.slice(1)),
      kind: id.startsWith("s") ? "smart" : "static",
    });
  }

  return Promise.resolve({
    ok: false,
    error: { name: "Error", message: `Unknown query key: ${key}` },
  });
};

/**
 * Canonical serialisation of an {@link AlbumFilter} for the query key.
 *
 * Two filters with the same meaning must map to the same key (the cache
 * identity), so inactive fields are dropped and the OR-set fields are
 * sorted — `{genres: ["a","b"]}` and `{genres: ["b","a"]}` share one entry.
 *
 * @param filter - Filter to serialise.
 * @returns Deterministic JSON of the active filter fields.
 */
export const serializeAlbumFilter = (filter: AlbumFilter): string => {
  const text = filter.text?.trim() ?? "";
  const genres = [...(filter.genres ?? [])].sort();
  const decades = [...(filter.decades ?? [])].sort(
    // Numeric ascending with the unknown-year marker (null) last.
    (a, b) => (a === null ? 1 : b === null ? -1 : a - b),
  );
  return JSON.stringify({
    ...(text !== "" ? { text } : {}),
    ...(genres.length > 0 ? { genres } : {}),
    ...(decades.length > 0 ? { decades } : {}),
  });
};

/** Key builders so call sites never hand-assemble key strings. */
export const queryKeys = {
  artists: "artists" as QueryKey,
  filterOptions: "filterOptions" as QueryKey,
  stats: "stats" as QueryKey,
  musicsByArtist: (artist: string): QueryKey => `musicsByArtist:${artist}`,
  albums: (filter: AlbumFilter): QueryKey =>
    `albums:${serializeAlbumFilter(filter)}`,
  musicsByAlbum: (albumKey: string): QueryKey => `musicsByAlbum:${albumKey}`,
  playlists: "playlists" as QueryKey,
  /** @param routeId - `p<id>` (static) / `s<id>` (smart), the route id form. */
  musicsByPlaylist: (routeId: string): QueryKey =>
    `musicsByPlaylist:${routeId}`,
};

/** The app-wide library query store. */
export const libraryStore = createQueryStore(fetchLibraryQuery);
