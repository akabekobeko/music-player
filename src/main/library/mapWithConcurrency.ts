/**
 * Map items through an async function with a fixed concurrency ceiling.
 *
 * A shared-cursor worker pool (mme-gui's `onLoadMany` approach): at most
 * `limit` invocations are in flight at once, which is what keeps metadata
 * extraction from exhausting file descriptors during import
 * (`docs/specs/v1.0/architecture/ipc.md`).
 *
 * `fn` is expected to capture its own failures (return a Result-ish value);
 * a rejection from `fn` rejects the whole call.
 *
 * @param items - Inputs, mapped in order (results keep the input order).
 * @param limit - Maximum concurrent invocations (>= 1).
 * @param fn - Async mapper; receives the item and its index.
 * @returns Results in the same order as `items`.
 */
export const mapWithConcurrency = async <T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) {
        return;
      }

      results[index] = await fn(items[index] as T, index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker),
  );
  return results;
};
