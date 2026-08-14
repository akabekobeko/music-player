import type { FetchState, QueryFetcher, QueryKey, QueryStore } from "./types";

type Entry = {
  state: FetchState<unknown>;
  /** Bumped by invalidation; stale responses fail the equality check. */
  generation: number;
  listeners: Set<() => void>;
};

/** Stable snapshot for unknown keys (`useSyncExternalStore` needs identity). */
const LOADING: FetchState<never> = { status: "loading" };

/**
 * Build a query store around a fetcher
 * (`docs/specs/v1.0/renderer/state-management.md`).
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
    patch: <T>(key: QueryKey, updater: (value: T) => T): void => {
      const entry = entries.get(key);
      if (entry === undefined || entry.state.status !== "success") {
        return;
      }

      // Bump the generation so an in-flight response cannot overwrite the
      // patch: the patch reflects a mutation that response predates.
      entry.generation += 1;
      entry.state = {
        status: "success",
        value: updater(entry.state.value as T),
      };
      for (const listener of [...entry.listeners]) {
        listener();
      }
    },
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
