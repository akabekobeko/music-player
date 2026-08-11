import type { IpcError, IpcResult } from "@mp/ipc";

/**
 * Query store skeleton (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * A React-free cache of Main query results keyed by string. Components read
 * it through `useSyncExternalStore`, so the whole app shares one mental
 * model with the audio engine: external state is `subscribe` / `getSnapshot`.
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

/** Store interface returned by {@link import("./createQueryStore").createQueryStore}. */
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
