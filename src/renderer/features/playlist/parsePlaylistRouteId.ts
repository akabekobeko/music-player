import type { PlaylistRef } from "./types";

/**
 * Parse a `:playlistId` route parameter
 * (`docs/specs/v1.0/renderer/routing-layout.md`).
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
