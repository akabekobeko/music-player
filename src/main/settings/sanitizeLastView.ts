import type { LastView, ViewSection } from "../ipc/types";

const SECTIONS: readonly ViewSection[] = ["artists", "albums", "playlists"];

/** Playlist route id shape (`p12` static, `s3` smart). */
const PLAYLIST_ROUTE_ID = /^[ps]\d+$/;

/**
 * Validate an unknown value as `AppSettings["lastView"]`.
 *
 * The section is required; a selection is kept only when it belongs to that
 * section and has the right shape. Whether the selected artist / playlist
 * still exists is decided by the renderer at restore time, not here.
 *
 * @param value - Raw `lastView` value from disk or a patch.
 * @returns The validated view, or `undefined` when the shape is wrong.
 */
export const sanitizeLastView = (value: unknown): LastView | undefined => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const section = SECTIONS.find((candidate) => candidate === raw.section);
  if (section === undefined) {
    return undefined;
  }

  return {
    section,
    ...(section === "artists" && typeof raw.artist === "string"
      ? { artist: raw.artist }
      : {}),
    ...(section === "playlists" &&
    typeof raw.playlist === "string" &&
    PLAYLIST_ROUTE_ID.test(raw.playlist)
      ? { playlist: raw.playlist }
      : {}),
  };
};
