import { type ReleaseResponse, releasesSchema } from "./schema";

export const RELEASES_API_URL =
  "https://api.github.com/repos/akabekobeko/parade/releases?per_page=10";

export type FetchReleasesOptions = {
  /** `GITHUB_TOKEN`; raises the rate limit from 60 to 5,000 per hour. */
  readonly token?: string;
  /** Attempts in total, including the first. */
  readonly attempts?: number;
  /** Pause between attempts in milliseconds. */
  readonly delayMs?: number;
  /** Per-attempt timeout in milliseconds. */
  readonly timeoutMs?: number;
  /** Injection point for tests. */
  readonly fetchFn?: typeof fetch;
};

/** Thrown for a status worth retrying (5xx, or 429 rate limiting). */
class TransientHttpError extends Error {}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch the latest releases from the GitHub REST API and validate the
 * response. Network errors, timeouts, 429 and 5xx are retried; a 4xx or a
 * response that fails validation is deterministic and thrown at once. Any
 * failure fails the build so stale data is never published
 * (docs/specs/web/architecture/release-data.md).
 *
 * @param options - Token, retry policy and fetch injection.
 * @returns The validated release list.
 */
export const fetchReleases = async ({
  token,
  attempts = 3,
  delayMs = 2000,
  timeoutMs = 10_000,
  fetchFn = fetch,
}: FetchReleasesOptions = {}): Promise<readonly ReleaseResponse[]> => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "parade-web",
  };
  if (token !== undefined && token !== "") {
    headers.Authorization = `Bearer ${token}`;
  }
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetchFn(RELEASES_API_URL, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status === 429 || response.status >= 500) {
        throw new TransientHttpError(
          `GitHub API responded ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(delayMs);
      }
      continue;
    }
    if (!response.ok) {
      throw new Error(
        `GitHub API responded ${response.status} ${response.statusText}`,
      );
    }
    return releasesSchema.parse(await response.json());
  }
  throw new Error(
    `Failed to fetch releases after ${attempts} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
};
