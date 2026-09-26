import type { MusicPictureInput } from "../../ipc/types";
import { fetchFrontCover } from "../fetchFrontCover";
import { lookupRelease } from "../lookupRelease";
import type {
  MusicBrainzClient,
  MusicBrainzRequestOptions,
} from "../MusicBrainzClient/MusicBrainzClient";
import type { Release } from "../schemas/releaseSchema";
import type { MusicBrainzResult } from "../types";

/**
 * Per-group memo of release lookups and front covers, keyed by release
 * MBID (`docs/specs/v1.2/architecture/lookup-strategy.md`).
 *
 * Several songs of one album group can resolve to the same release (the
 * album-level match, or per-song fallbacks landing on the same album), and
 * each lookup costs a rate-limit slot while a cover can be several MB.
 * Memoising the promises makes every release cost one lookup and one cover
 * per group at most. A class because the two maps are shared, mutable
 * state that lives exactly as long as one group lookup.
 */
export class ReleaseCache {
  readonly #client: MusicBrainzClient;
  readonly #options: MusicBrainzRequestOptions;
  readonly #releases = new Map<string, Promise<MusicBrainzResult<Release>>>();
  readonly #covers = new Map<
    string,
    Promise<MusicBrainzResult<MusicPictureInput | null>>
  >();

  /**
   * @param client - The shared client.
   * @param options - Cancellation signal applied to every request.
   */
  constructor(client: MusicBrainzClient, options: MusicBrainzRequestOptions) {
    this.#client = client;
    this.#options = options;
  }

  /**
   * Look up a release once per cache.
   *
   * @param releaseId - Release MBID.
   * @returns The parsed release or the failure (also memoised).
   */
  lookup(releaseId: string): Promise<MusicBrainzResult<Release>> {
    let pending = this.#releases.get(releaseId);
    if (pending === undefined) {
      pending = lookupRelease(this.#client, releaseId, this.#options);
      this.#releases.set(releaseId, pending);
    }

    return pending;
  }

  /**
   * Fetch a release's front cover once per cache.
   *
   * @param release - The looked-up release (its group id is the last fallback).
   * @returns The image, `null` when none exists, or the failure (also memoised).
   */
  cover(
    release: Release,
  ): Promise<MusicBrainzResult<MusicPictureInput | null>> {
    let pending = this.#covers.get(release.id);
    if (pending === undefined) {
      pending = fetchFrontCover(
        this.#client,
        release.id,
        release["release-group"]?.id,
        this.#options,
      );
      this.#covers.set(release.id, pending);
    }

    return pending;
  }
}
