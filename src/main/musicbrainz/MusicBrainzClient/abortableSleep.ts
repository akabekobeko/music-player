/**
 * Wait `ms`, or less when `signal` aborts first
 * (`docs/specs/v1.2/architecture/rate-limit.md`). Resolves either way; the
 * caller checks `signal.aborted` afterwards. This is what lets a cancel cut
 * through the minimum-interval and `Retry-After` waits instead of holding
 * the app-wide queue until they expire.
 *
 * @param ms - Delay in ms.
 * @param signal - Optional cancellation signal.
 * @returns Resolves after the delay or on abort.
 */
export const abortableSleep = (
  ms: number,
  signal?: AbortSignal,
): Promise<void> =>
  new Promise((resolve) => {
    if (signal?.aborted === true) {
      resolve();
      return;
    }

    const onAbort = (): void => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
