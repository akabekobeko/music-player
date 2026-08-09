import type { AlbumSummary } from "@mp/ipc";
import { compareNameWithoutArticle } from "@/features/library/compareNameWithoutArticle";

/**
 * Album grid order (`docs/specs/v1.0/features/album-view.md`): artist name
 * (article-blind, like the artist list) → year ascending with unknown years
 * last → album name as the tie-breaker. v1.0 has no sort-switching UI, so
 * this is the one and only order.
 *
 * Render-time derivation over Main's stable base order — the article-blind
 * comparison is locale-ish presentation logic and lives in the Renderer.
 *
 * @param albums - Result of `mp:library:getAlbums` (any order).
 * @returns A sorted copy.
 */
export const sortAlbums = (albums: readonly AlbumSummary[]): AlbumSummary[] =>
  albums.toSorted((a, b) => {
    const byArtist = compareNameWithoutArticle(a.artist, b.artist);
    if (byArtist !== 0) {
      return byArtist;
    }

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
