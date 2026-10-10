import { classifyAssets } from "./classifyAssets";
import type { ReleaseResponse } from "./schema";
import { type LatestRelease, PLATFORMS } from "./types";

export type SelectedRelease = {
  readonly release: LatestRelease;
  /** Asset names of the chosen release that did not classify. */
  readonly unmatched: readonly string[];
};

/**
 * Pick the release to show: the newest published (not draft, not
 * prerelease) release that has at least one classifiable asset. A release
 * whose assets are still being uploaded by the Release workflow is skipped,
 * so the page keeps showing the previous version until they arrive.
 *
 * @param releases - Parsed release list, any order.
 * @returns The chosen release, or `undefined` when none qualifies.
 */
export const selectLatestRelease = (
  releases: readonly ReleaseResponse[],
): SelectedRelease | undefined => {
  const candidates = releases
    .filter(
      (release) =>
        !release.draft && !release.prerelease && release.published_at !== null,
    )
    .sort((a, b) =>
      (b.published_at as string).localeCompare(a.published_at as string),
    );
  for (const candidate of candidates) {
    const { downloads, unmatched } = classifyAssets(candidate.assets);
    if (!PLATFORMS.some((platform) => downloads[platform].length > 0)) {
      continue;
    }
    return {
      release: {
        tag: candidate.tag_name,
        version: candidate.tag_name.replace(/^v/, ""),
        url: candidate.html_url,
        publishedAt: new Date(candidate.published_at as string),
        downloads,
      },
      unmatched,
    };
  }
  return undefined;
};
