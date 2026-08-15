import type { Music } from "@mp/ipc";

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
  /** Representative producer (first non-empty). */
  readonly producer: string;
  /** Representative conductor (first non-empty). */
  readonly conductor: string;
  /** Representative publisher / record label (first non-empty). */
  readonly publisher: string;
  readonly musicCount: number;
  readonly totalDurationMs: number;
  /** Representative artwork (first track that has one). */
  readonly picturePath: string | null;
  /** Discs in ascending order; a single-disc album has exactly one entry. */
  readonly discs: readonly AlbumDisc[];
};
