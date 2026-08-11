import type { PlaylistRef } from "./types";

/**
 * Build the route id of a playlist
 * (`docs/specs/v1.0/renderer/routing-layout.md`).
 *
 * @param ref - Playlist id and kind.
 * @returns `p<id>` or `s<id>`.
 */
export const playlistRouteId = (ref: PlaylistRef): string =>
  `${ref.kind === "smart" ? "s" : "p"}${ref.id}`;
