import type { Music, MusicInfoCandidate } from "../../ipc/types";
import { buildRecordingQuery } from "../buildRecordingQuery";
import { fetchFrontCover } from "../fetchFrontCover";
import { lookupRelease } from "../lookupRelease";
import type {
  MusicBrainzClient,
  MusicBrainzRequestOptions,
} from "../MusicBrainzClient/MusicBrainzClient";
import { searchRecordings } from "../searchRecordings";
import { toMusicInfoCandidate } from "../toMusicInfoCandidate/toMusicInfoCandidate";
import type { MusicBrainzResult } from "../types";
import { findTrackByRecording } from "./findTrackByRecording";
import { selectRecordingHit } from "./selectRecordingHit";
import { selectRecordingRelease } from "./selectRecordingRelease";

/**
 * Per-song lookup through a recording search
 * (`docs/specs/v1.2/architecture/lookup-strategy.md`): used for songs
 * without an album tag and for songs that could not be matched to a track
 * of their album's release.
 *
 * The strict query (with duration window and track number) runs first; when
 * it returns no hits at all, the relaxed query runs once. The chosen
 * recording's release is looked up with the full `inc=` set, the track
 * playing that recording is mapped, and the release's front cover is
 * fetched. Two to three requests to musicbrainz.org per song.
 *
 * @param client - The shared client.
 * @param music - The library song.
 * @param options - Cancellation signal.
 * @returns The candidate, `null` when nothing matched, or the failure.
 */
export const lookupByRecording = async (
  client: MusicBrainzClient,
  music: Music,
  options: MusicBrainzRequestOptions = {},
): Promise<MusicBrainzResult<MusicInfoCandidate | null>> => {
  const strict = buildRecordingQuery(music);
  let search = await searchRecordings(client, strict, options);
  if (!search.ok) {
    return search;
  }

  const relaxed = buildRecordingQuery(music, { relaxed: true });
  if ((search.value.recordings ?? []).length === 0 && relaxed !== strict) {
    search = await searchRecordings(client, relaxed, options);
    if (!search.ok) {
      return search;
    }
  }

  const hit = selectRecordingHit(search.value, music.durationMs);
  if (hit === null) {
    return { ok: true, value: null };
  }

  const releaseRef = selectRecordingRelease(hit, music.album);
  if (releaseRef === null) {
    return { ok: true, value: null };
  }

  const release = await lookupRelease(client, releaseRef.id, options);
  if (!release.ok) {
    return release;
  }

  const matched = findTrackByRecording(release.value, hit.id);
  if (matched === null) {
    console.warn(
      `[musicbrainz] recording ${hit.id} not listed on release ${releaseRef.id}`,
    );
    return { ok: true, value: null };
  }

  const picture = await fetchFrontCover(
    client,
    release.value.id,
    release.value["release-group"]?.id,
    options,
  );
  if (!picture.ok) {
    return picture;
  }

  return {
    ok: true,
    value: toMusicInfoCandidate({
      release: release.value,
      medium: matched.medium,
      track: matched.track,
      score: hit.score,
      picture: picture.value,
    }),
  };
};
