import type { AlbumFilter } from "@mp/ipc";
import type { QueryFetcher } from "./types";

/**
 * Map a {@link import("./types").QueryKey} to its `window.mp.library` call.
 *
 * Extended as views land in later phases (albums, filter options, …).
 *
 * @param key - Query key to resolve.
 * @returns The pending IPC result.
 */
export const fetchLibraryQuery: QueryFetcher = (key) => {
  if (key === "artists") {
    return window.mp.library.getArtists();
  }

  if (key === "filterOptions") {
    return window.mp.library.getFilterOptions();
  }

  if (key === "stats") {
    return window.mp.library.getStats();
  }

  const byArtistPrefix = "musicsByArtist:";
  if (key.startsWith(byArtistPrefix)) {
    return window.mp.library.getMusicsByArtist({
      artist: key.slice(byArtistPrefix.length),
    });
  }

  const albumsPrefix = "albums:";
  if (key.startsWith(albumsPrefix)) {
    return window.mp.library.getAlbums(
      JSON.parse(key.slice(albumsPrefix.length)) as AlbumFilter,
    );
  }

  const byAlbumPrefix = "musicsByAlbum:";
  if (key.startsWith(byAlbumPrefix)) {
    return window.mp.library.getMusicsByAlbum({
      albumKey: key.slice(byAlbumPrefix.length),
    });
  }

  if (key === "playlists") {
    return window.mp.playlist.list();
  }

  const byPlaylistPrefix = "musicsByPlaylist:";
  if (key.startsWith(byPlaylistPrefix)) {
    const id = key.slice(byPlaylistPrefix.length);
    return window.mp.playlist.getMusics({
      playlistId: Number(id.slice(1)),
      kind: id.startsWith("s") ? "smart" : "static",
    });
  }

  return Promise.resolve({
    ok: false,
    error: { name: "Error", message: `Unknown query key: ${key}` },
  });
};
