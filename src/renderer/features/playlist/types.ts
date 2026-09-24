import type { PlaylistKind } from "@mp/ipc";

/**
 * A parsed playlist route id
 * (`docs/specs/v1.0/renderer/routing-layout.md`): `/playlists/p<id>` is a
 * static playlist, `/playlists/s<id>` a smart one. The prefix exists because
 * ids are only unique within their kind (separate tables).
 */
export type PlaylistRef = {
  /** Playlist id; unique only within `kind`. */
  readonly id: number;
  /** `static` (route prefix `p`) or `smart` (route prefix `s`). */
  readonly kind: PlaylistKind;
};
