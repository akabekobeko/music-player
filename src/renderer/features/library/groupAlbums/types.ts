import type { Music } from "@mp/ipc";

/** Tracks of one disc within an album. */
export type AlbumDisc = {
  /** Disc number (1-based; `1` when the tag is unset). */
  readonly disc: number;
  /** The disc's tracks in ascending track number. */
  readonly musics: readonly Music[];
};

/** One album section of the Artist view. */
export type AlbumGroup = {
  /** Identity key (albumArtist ⊕ album); stable for React keys. */
  readonly key: string;
  /** Album title as tagged; empty when the tracks carry no album tag. */
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
  /** Number of tracks across all discs. */
  readonly musicCount: number;
  /** Sum of the tracks' `durationMs` in milliseconds (unmeasured adds 0). */
  readonly totalDurationMs: number;
  /** Representative artwork (first track that has one). */
  readonly picturePath: string | null;
  /** Discs in ascending order; a single-disc album has exactly one entry. */
  readonly discs: readonly AlbumDisc[];
};
