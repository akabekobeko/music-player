import type { Music, MusicInfoCandidate } from "../../ipc/types";
import { buildReleaseQuery } from "../buildReleaseQuery";
import type {
  MusicBrainzClient,
  MusicBrainzRequestOptions,
} from "../MusicBrainzClient/MusicBrainzClient";
import { searchReleases } from "../searchReleases";
import { toMusicInfoCandidate } from "../toMusicInfoCandidate/toMusicInfoCandidate";
import type { MusicBrainzError, MusicBrainzResult } from "../types";
import { findTrackFor, type MatchedTrack } from "./findTrackFor";
import { lookupByRecording } from "./lookupByRecording";
import { ReleaseCache } from "./ReleaseCache";
import { selectReleaseHit } from "./selectReleaseHit";

/**
 * Outcome of one album group, keyed by `Music.id`. `ok: true` with `null`
 * is "not found"; `ok: false` is a request failure. A failure of the
 * group-level requests (release search, lookup) is repeated under every
 * song of the group; a cover failure only under the songs that matched
 * the release.
 */
export type AlbumGroupLookup = ReadonlyMap<
  number,
  MusicBrainzResult<MusicInfoCandidate | null>
>;

/**
 * Build the candidates of one album group
 * (`docs/specs/v1.2/architecture/lookup-strategy.md`).
 *
 * The songs must share the album identity (display artist + album), as
 * grouped by `groupMusicsByAlbum`. With an album title, one release search
 * and one lookup serve the whole group (two requests regardless of size)
 * and each song is matched to a track; the cover is fetched only once at
 * least one song matched. Songs without a match, and every song when the
 * album is unknown or no release qualifies, go through the per-song
 * recording search, sharing the group's release / cover cache.
 *
 * @param client - The shared client.
 * @param musics - Songs of one album group.
 * @param options - Cancellation signal.
 * @returns One result per song.
 */
export const lookupAlbumGroup = async (
  client: MusicBrainzClient,
  musics: readonly Music[],
  options: MusicBrainzRequestOptions = {},
): Promise<AlbumGroupLookup> => {
  const results = new Map<
    number,
    MusicBrainzResult<MusicInfoCandidate | null>
  >();
  const first = musics[0];
  if (first === undefined) {
    return results;
  }

  const cache = new ReleaseCache(client, options);
  let remaining: readonly Music[] = musics;
  if (first.album.trim() !== "") {
    const search = await searchReleases(
      client,
      buildReleaseQuery(first),
      options,
    );
    if (!search.ok) {
      return failAll(musics, search.error);
    }

    const hit = selectReleaseHit(search.value, musics.length);
    if (hit !== null) {
      const release = await cache.lookup(hit.id);
      if (!release.ok) {
        return failAll(musics, release.error);
      }

      const matched: Array<{ music: Music; track: MatchedTrack }> = [];
      const unmatched: Music[] = [];
      for (const music of musics) {
        const track = findTrackFor(release.value, music);
        if (track === null) {
          unmatched.push(music);
        } else {
          matched.push({ music, track });
        }
      }

      if (matched.length > 0) {
        const picture = await cache.cover(release.value);
        for (const { music, track } of matched) {
          results.set(
            music.id,
            picture.ok
              ? {
                  ok: true,
                  value: toMusicInfoCandidate({
                    release: release.value,
                    medium: track.medium,
                    track: track.track,
                    score: hit.score,
                    picture: picture.value,
                  }),
                }
              : picture,
          );
        }
      }

      remaining = unmatched;
    }
  }

  for (const music of remaining) {
    results.set(
      music.id,
      await lookupByRecording(client, cache, music, options),
    );
  }

  return results;
};

/** The same failure under every song of the group. */
const failAll = (
  musics: readonly Music[],
  error: MusicBrainzError,
): AlbumGroupLookup =>
  new Map(musics.map((music) => [music.id, { ok: false, error }]));
