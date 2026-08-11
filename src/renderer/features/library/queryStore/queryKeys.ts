import type { AlbumFilter } from "@mp/ipc";
import { serializeAlbumFilter } from "./serializeAlbumFilter";
import type { QueryKey } from "./types";

/** Key builders so call sites never hand-assemble key strings. */
export const queryKeys = {
  artists: "artists" as QueryKey,
  filterOptions: "filterOptions" as QueryKey,
  stats: "stats" as QueryKey,
  musicsByArtist: (artist: string): QueryKey => `musicsByArtist:${artist}`,
  albums: (filter: AlbumFilter): QueryKey =>
    `albums:${serializeAlbumFilter(filter)}`,
  musicsByAlbum: (albumKey: string): QueryKey => `musicsByAlbum:${albumKey}`,
  playlists: "playlists" as QueryKey,
  /** @param routeId - `p<id>` (static) / `s<id>` (smart), the route id form. */
  musicsByPlaylist: (routeId: string): QueryKey =>
    `musicsByPlaylist:${routeId}`,
};
