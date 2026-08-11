import type { Music } from "@mp/ipc";
import type { AlbumGroup } from "@/features/library/groupAlbums/types";

/**
 * Flatten album groups into a single virtualizable row stream
 * (`docs/specs/v1.0/features/artist-view.md`).
 *
 * Nested sections (album → disc → tracks) virtualize poorly with dynamic
 * heights; a flat list of typed rows with fixed per-type heights keeps the
 * virtualizer exact. Disc heading rows appear only for multi-disc albums.
 */
export type AlbumRow =
  | { readonly type: "album"; readonly group: AlbumGroup }
  | {
      readonly type: "disc";
      readonly albumKey: string;
      readonly disc: number;
    }
  | {
      readonly type: "music";
      readonly albumKey: string;
      readonly music: Music;
    };

/** Row heights in px, by row type (virtualizer estimates). */
export const ALBUM_ROW_HEIGHTS: Record<AlbumRow["type"], number> = {
  album: 136,
  disc: 32,
  music: 36,
};

/**
 * Build the flat row stream for an artist's album groups.
 *
 * @param groups - Result of `groupAlbums` (already ordered).
 * @returns Rows in display order.
 */
export const buildAlbumRows = (groups: readonly AlbumGroup[]): AlbumRow[] => {
  const rows: AlbumRow[] = [];
  for (const group of groups) {
    rows.push({ type: "album", group });
    const multiDisc = group.discs.length > 1;
    for (const disc of group.discs) {
      if (multiDisc) {
        rows.push({ type: "disc", albumKey: group.key, disc: disc.disc });
      }

      for (const music of disc.musics) {
        rows.push({ type: "music", albumKey: group.key, music });
      }
    }
  }

  return rows;
};
