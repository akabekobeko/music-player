import type { Music } from "@mp/ipc";
import type { AlbumGroup } from "./groupAlbums/types";

/**
 * The artist's full play order: albums (year ascending) → disc → track.
 *
 * This is the queue the header Play button and track-click playback use
 * (`docs/specs/v1.0/features/artist-view.md`).
 *
 * @param groups - Result of {@link import("./groupAlbums/groupAlbums").groupAlbums}.
 * @returns Tracks flattened in play order.
 */
export const flattenAlbumMusics = (groups: readonly AlbumGroup[]): Music[] =>
  groups.flatMap((group) => group.discs.flatMap((disc) => [...disc.musics]));
