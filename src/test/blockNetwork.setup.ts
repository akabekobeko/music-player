/**
 * Vitest setup: fail any test that reaches the real network.
 *
 * The MusicBrainz code paths inject their `fetch` (a fake in every test)
 * and Electron's `net` is stubbed by `electron.mock.ts`, so nothing in the
 * suite should ever talk to musicbrainz.org or coverartarchive.org. This
 * guard turns an accidental real request (a test built without injected
 * seams, a future helper using the global `fetch`) into an immediate
 * failure instead of load on MusicBrainz from every CI run
 * (`docs/specs/v1.2/architecture/rate-limit.md`).
 */
globalThis.fetch = ((input: RequestInfo | URL) => {
  const url =
    typeof input === "string" || input instanceof URL
      ? String(input)
      : input.url;
  throw new Error(
    `[no-network] a test tried to fetch ${url}; inject a fake fetch instead`,
  );
}) as typeof fetch;
