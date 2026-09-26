import { IMAGE_EXTENSION_BY_MIME } from "../../shared/constants";
import type { MusicPictureInput } from "../ipc/types";
import { COVER_ART_ARCHIVE_BASE } from "./constants";
import type {
  MusicBrainzClient,
  MusicBrainzRequestOptions,
} from "./MusicBrainzClient/MusicBrainzClient";
import { toFetchError } from "./MusicBrainzClient/toFetchError";
import type { MusicBrainzResult } from "./types";

/**
 * Fetch the front cover of a release from the Cover Art Archive
 * (`docs/specs/v1.2/architecture/lookup-strategy.md`).
 *
 * Tries the 1,200 px thumbnail, then the original, then the release
 * group's thumbnail; a 404 at each step moves on to the next and a 404 at
 * the last step means "no artwork", which is a result, not an error. The
 * archive redirects to archive.org for the bytes; `net.fetch` follows it.
 * A 2xx body whose `Content-Type` is not a supported image (an HTML
 * interstitial, for example) is skipped like a 404.
 *
 * @param client - The shared client.
 * @param releaseId - Release MBID.
 * @param releaseGroupId - Release group MBID for the last fallback, if known.
 * @param options - Cancellation signal.
 * @returns The image, `null` when none exists, or the failure.
 */
export const fetchFrontCover = async (
  client: MusicBrainzClient,
  releaseId: string,
  releaseGroupId: string | undefined,
  options: MusicBrainzRequestOptions = {},
): Promise<MusicBrainzResult<MusicPictureInput | null>> => {
  const release = encodeURIComponent(releaseId);
  const urls = [
    `${COVER_ART_ARCHIVE_BASE}/release/${release}/front-1200`,
    `${COVER_ART_ARCHIVE_BASE}/release/${release}/front`,
  ];
  if (releaseGroupId !== undefined) {
    urls.push(
      `${COVER_ART_ARCHIVE_BASE}/release-group/${encodeURIComponent(releaseGroupId)}/front-1200`,
    );
  }

  for (const url of urls) {
    const response = await client.request(url, options);
    if (!response.ok) {
      if (response.error.code === "MB_HTTP_404") {
        continue;
      }

      return response;
    }

    const mimeType = mimeTypeOf(response.value.headers.get("Content-Type"));
    if (mimeType === null || IMAGE_EXTENSION_BY_MIME[mimeType] === undefined) {
      console.warn(`[musicbrainz] unsupported cover type ${url}: ${mimeType}`);
      await response.value.body?.cancel().catch(() => undefined);
      continue;
    }

    try {
      const data = new Uint8Array(await response.value.arrayBuffer());
      return { ok: true, value: { mimeType, data } };
    } catch (error) {
      const failure = toFetchError(error, options.signal);
      console.warn(
        `[musicbrainz] cover download failed ${url}: ${failure.message}`,
      );
      return { ok: false, error: failure };
    }
  }

  return { ok: true, value: null };
};

/** Media type of a `Content-Type` header without parameters, lower-cased. */
const mimeTypeOf = (contentType: string | null): string | null => {
  const type = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  return type === "" ? null : type;
};
