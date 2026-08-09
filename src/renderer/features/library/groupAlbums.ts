import type { Music } from "@mp/ipc";

/**
 * Render-time album grouping for the Artist view
 * (`docs/specs/v1.0/features/artist-view.md`).
 *
 * The identity key is `(albumArtist falling back to artist, album)` — the
 * same identity the database spec defines — so two same-named albums by
 * different album artists never merge (audio-player grouped on the album
 * string alone and fused them).
 *
 * Pure derivation: called during render, never copied into state.
 */

/** Tracks of one disc within an album. */
export type AlbumDisc = {
  readonly disc: number;
  readonly musics: readonly Music[];
};

/** One album section of the Artist view. */
export type AlbumGroup = {
  /** Identity key (albumArtist ⊕ album); stable for React keys. */
  readonly key: string;
  readonly album: string;
  /** Display artist: albumArtist, falling back to artist. */
  readonly artist: string;
  /** Representative year (smallest non-null), or `null`. */
  readonly year: number | null;
  /** Representative genre (first non-empty). */
  readonly genre: string;
  readonly musicCount: number;
  readonly totalDurationMs: number;
  /** Representative artwork (first track that has one). */
  readonly picturePath: string | null;
  /** Discs in ascending order; a single-disc album has exactly one entry. */
  readonly discs: readonly AlbumDisc[];
};

/** The album-identity part of the key. */
const albumArtistOf = (music: Music): string =>
  music.albumArtist !== "" ? music.albumArtist : music.artist;

/**
 * Group an artist's tracks into ordered album sections.
 *
 * Albums are ordered by year ascending with unknown years last (ties on the
 * album name); tracks within a disc by track number, discs ascending.
 *
 * @param musics - The artist's tracks (any order).
 * @returns Ordered album groups.
 */
export const groupAlbums = (musics: readonly Music[]): AlbumGroup[] => {
  const byKey = new Map<string, Music[]>();
  for (const music of musics) {
    // NUL separator: cannot occur in tag strings, so ("A B", "C") and
    // ("A", "B C") can never collide.
    const key = `${albumArtistOf(music)}\u0000${music.album}`;
    const bucket = byKey.get(key);
    if (bucket === undefined) {
      byKey.set(key, [music]);
    } else {
      bucket.push(music);
    }
  }

  const groups = [...byKey.entries()].map(([key, tracks]): AlbumGroup => {
    const sorted = tracks.toSorted(
      (a, b) => a.disc - b.disc || a.track - b.track,
    );
    const discNumbers = [...new Set(sorted.map((music) => music.disc))];
    const first = sorted[0] as Music;
    return {
      key,
      album: first.album,
      artist: albumArtistOf(first),
      year: sorted.reduce<number | null>(
        (min, music) =>
          music.year !== null && (min === null || music.year < min)
            ? music.year
            : min,
        null,
      ),
      genre: sorted.find((music) => music.genre !== "")?.genre ?? "",
      musicCount: sorted.length,
      totalDurationMs: sorted.reduce(
        (total, music) => total + music.durationMs,
        0,
      ),
      picturePath:
        sorted.find((music) => music.picturePath !== null)?.picturePath ?? null,
      discs: discNumbers.map((disc) => ({
        disc,
        musics: sorted.filter((music) => music.disc === disc),
      })),
    };
  });

  return groups.toSorted((a, b) => {
    if (a.year !== b.year) {
      if (a.year === null) {
        return 1;
      }

      if (b.year === null) {
        return -1;
      }

      return a.year - b.year;
    }

    return a.album < b.album ? -1 : a.album > b.album ? 1 : 0;
  });
};

/**
 * The artist's full play order: albums (year ascending) → disc → track.
 *
 * This is the queue the header Play button and track-click playback use
 * (`docs/specs/v1.0/features/artist-view.md`).
 *
 * @param groups - Result of {@link groupAlbums}.
 * @returns Tracks flattened in play order.
 */
export const flattenAlbumMusics = (groups: readonly AlbumGroup[]): Music[] =>
  groups.flatMap((group) => group.discs.flatMap((disc) => [...disc.musics]));
