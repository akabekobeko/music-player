import { useParams } from "react-router";
import { useT } from "@/features/i18n/useT";
import { parsePlaylistRouteId } from "@/features/playlist/parsePlaylistRouteId";
import { PlaylistContent } from "./PlaylistContent";

/**
 * Playlist view content (`/playlists/:playlistId?`)
 * (`docs/specs/v1.0/features/playlist.md`): header (name, counts, Play /
 * Shuffle) and the position-ordered track list — ordinal numbers, artist /
 * album columns, drag & drop reorder, and per-row removal. Every playback
 * action queues the playlist's tracks (`QueueSource: "playlist"`).
 */
export const PageContent = () => {
  const t = useT();
  const { playlistId } = useParams();
  const ref =
    playlistId !== undefined ? parsePlaylistRouteId(playlistId) : null;
  return (
    <div className="h-full">
      {playlistId === undefined ? (
        <section className="p-6">
          <p className="text-muted-foreground text-sm">
            {t("playlist.selectPrompt")}
          </p>
        </section>
      ) : ref === null ? (
        <section className="p-6">
          <p className="text-muted-foreground text-sm">
            {t("playlist.notFound")}
          </p>
        </section>
      ) : (
        <PlaylistContent key={playlistId} routeId={playlistId} />
      )}
    </div>
  );
};
