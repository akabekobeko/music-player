import { useParams } from "react-router";

/**
 * Playlist view route (`/playlists`, `/playlists/:playlistId`).
 *
 * `playlistId` is `p<id>` (static) or `s<id>` (smart) per
 * `docs/specs/v1.0/renderer/routing-layout.md`. Placeholder shell — playlist
 * management is implemented in Phase 6 (issue: Playlist).
 */
export const PlaylistsPage = () => {
  const { playlistId } = useParams();
  return (
    <section className="p-6">
      <h1 className="text-lg font-semibold">Playlists</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {playlistId !== undefined
          ? `Selected: ${playlistId}`
          : "プレイリストビューは Phase 6 で実装します。"}
      </p>
    </section>
  );
};
