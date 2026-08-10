import type { PlaylistKind } from "@mp/ipc";

/**
 * Playlist route-id codec (`docs/specs/v1.0/renderer/routing-layout.md`):
 * `/playlists/p<id>` is a static playlist, `/playlists/s<id>` a smart one.
 * The prefix exists because ids are only unique within their kind (separate
 * tables).
 */

/** A parsed playlist route id. */
export type PlaylistRef = {
  readonly id: number;
  readonly kind: PlaylistKind;
};

/**
 * Build the route id of a playlist.
 *
 * @param ref - Playlist id and kind.
 * @returns `p<id>` or `s<id>`.
 */
export const playlistRouteId = (ref: PlaylistRef): string =>
  `${ref.kind === "smart" ? "s" : "p"}${ref.id}`;

/**
 * Parse a `:playlistId` route parameter.
 *
 * @param routeId - Raw parameter value.
 * @returns The parsed reference, or `null` for a malformed id.
 */
export const parsePlaylistRouteId = (routeId: string): PlaylistRef | null => {
  const match = /^([ps])(\d+)$/.exec(routeId);
  if (match === null) {
    return null;
  }

  return {
    id: Number(match[2]),
    kind: match[1] === "s" ? "smart" : "static",
  };
};
