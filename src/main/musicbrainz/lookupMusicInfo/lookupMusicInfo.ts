import type { Music, MusicInfoCandidate } from "../../ipc/types";
import type {
  MusicBrainzClient,
  MusicBrainzRequestOptions,
} from "../MusicBrainzClient/MusicBrainzClient";
import type { MusicBrainzResult } from "../types";
import { lookupAlbumGroup } from "./lookupAlbumGroup";

/**
 * Build the candidate of one song, the entry point of the music info
 * dialog's fetch button (`docs/specs/v1.2/architecture/lookup-strategy.md`).
 * A single song is an album group of one, so the album-level search still
 * applies when the song has an album tag.
 *
 * @param client - The shared client.
 * @param music - The library song.
 * @param options - Cancellation signal.
 * @returns The candidate, `null` when nothing matched, or the failure.
 */
export const lookupMusicInfo = async (
  client: MusicBrainzClient,
  music: Music,
  options: MusicBrainzRequestOptions = {},
): Promise<MusicBrainzResult<MusicInfoCandidate | null>> =>
  (await lookupAlbumGroup(client, [music], options)).get(music.id) ?? {
    ok: true,
    value: null,
  };
