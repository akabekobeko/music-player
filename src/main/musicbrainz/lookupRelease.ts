import { MUSICBRAINZ_API_BASE, RELEASE_LOOKUP_INC } from "./constants";
import type {
  MusicBrainzClient,
  MusicBrainzRequestOptions,
} from "./MusicBrainzClient/MusicBrainzClient";
import { requestJson } from "./requestJson";
import { type Release, releaseSchema } from "./schemas/releaseSchema";
import type { MusicBrainzResult } from "./types";

/**
 * Look up one release with every `inc=` the candidate needs
 * (`docs/specs/v1.2/architecture/release-lookup.md`). One response holds
 * the whole track list plus the artist credits, labels, release group,
 * genres and relationships the mapping reads.
 *
 * `inc=` is appended verbatim: its `+` separators must not be
 * percent-encoded, which `URLSearchParams` would do.
 *
 * @param client - The shared client.
 * @param releaseId - Release MBID.
 * @param options - Cancellation signal.
 * @returns The parsed release.
 */
export const lookupRelease = (
  client: MusicBrainzClient,
  releaseId: string,
  options: MusicBrainzRequestOptions = {},
): Promise<MusicBrainzResult<Release>> =>
  requestJson(
    client,
    `${MUSICBRAINZ_API_BASE}/release/${encodeURIComponent(releaseId)}?inc=${RELEASE_LOOKUP_INC}&fmt=json`,
    releaseSchema,
    options,
  );
