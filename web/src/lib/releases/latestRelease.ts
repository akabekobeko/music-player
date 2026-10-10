import { fetchReleases } from "./fetchReleases";
import fixture from "./fixtures/releases.json";
import { releasesSchema } from "./schema";
import { selectLatestRelease } from "./selectLatestRelease";
import type { LatestRelease } from "./types";

export type LatestReleaseResult =
  | { readonly status: "ok"; readonly release: LatestRelease }
  | { readonly status: "error"; readonly message: string };

const load = async (): Promise<LatestRelease> => {
  const releases =
    process.env.PARADE_WEB_RELEASE_FIXTURE === "1"
      ? releasesSchema.parse(fixture)
      : await fetchReleases({ token: process.env.GITHUB_TOKEN });
  const selected = selectLatestRelease(releases);
  if (selected === undefined) {
    throw new Error("No published release with downloadable assets");
  }
  for (const name of selected.unmatched) {
    console.warn(`[releases] asset left off the download page: ${name}`);
  }
  return selected.release;
};

let pending: Promise<LatestReleaseResult> | undefined;

/**
 * The latest release, fetched once per build and shared by every page and
 * locale. In the dev server a failure is returned as a result so the other
 * pages stay workable; in a build it is thrown so the deploy stops.
 *
 * @returns The release, or the failure in the dev server.
 */
export const getLatestRelease = (): Promise<LatestReleaseResult> => {
  pending ??= load().then(
    (release) => ({ status: "ok", release }),
    (error: unknown) => {
      if (!import.meta.env.DEV) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[releases] ${message}`);
      // Not memoised, so the next request after a transient outage retries.
      pending = undefined;
      return { status: "error", message };
    },
  );
  return pending;
};
