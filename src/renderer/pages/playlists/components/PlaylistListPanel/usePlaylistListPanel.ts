import type { Playlist, SmartPlaylistRules } from "@mp/ipc";
import { useState } from "react";
import { useMatch, useNavigate } from "react-router";
import { useT } from "@/features/i18n/useT";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import { createSmartPlaylist } from "@/features/playlist/playlistCommands/createSmartPlaylist";
import { createStaticPlaylist } from "@/features/playlist/playlistCommands/createStaticPlaylist";
import { removePlaylist } from "@/features/playlist/playlistCommands/removePlaylist";
import { updatePlaylist } from "@/features/playlist/playlistCommands/updatePlaylist";
import { playlistRouteId } from "@/features/playlist/playlistRouteId";

/**
 * Logic of `PlaylistListPanel`: the playlist list (with a client-side name
 * filter), creation (static / smart), inline rename, deletion behind confirmation, and navigation to
 * the selected playlist. The component only renders what this hook returns.
 */
export const usePlaylistListPanel = () => {
  const t = useT();
  const navigate = useNavigate();
  const selectedRouteId = useMatch("/playlists/:playlistId")?.params.playlistId;
  const playlistsState = useLibraryQuery<readonly Playlist[]>(
    queryKeys.playlists,
  );
  /** Route id of the playlist being renamed inline, or `null`. */
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  /** Playlist pending delete confirmation, or `null`. */
  const [deleting, setDeleting] = useState<Playlist | null>(null);
  /** Whether the smart-playlist creation dialog is open. */
  const [creatingSmart, setCreatingSmart] = useState(false);
  /** Client-side name filter typed into the header's search box. */
  const [query, setQuery] = useState("");

  const playlists =
    playlistsState.status === "success"
      ? playlistsState.value.filter((playlist) =>
          playlist.name.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : [];

  const openPlaylist = (routeId: string): void => {
    navigate(`/playlists/${routeId}`);
  };

  const create = async (): Promise<void> => {
    const created = await createStaticPlaylist(t("playlist.defaultName"));
    if (created !== null) {
      const routeId = playlistRouteId(created);
      navigate(`/playlists/${routeId}`);
      setEditingRouteId(routeId); // Name straight away — inline edit.
    }
  };

  /** Create a smart playlist from the dialog's rules and open it. */
  const createSmart = async (
    rules: SmartPlaylistRules,
    name: string,
  ): Promise<void> => {
    setCreatingSmart(false);
    const created = await createSmartPlaylist(
      name !== "" ? name : t("playlist.defaultName"),
      rules,
    );
    if (created !== null) {
      navigate(`/playlists/${playlistRouteId(created)}`);
    }
  };

  const rename = async (playlist: Playlist, name: string): Promise<void> => {
    setEditingRouteId(null);
    const trimmed = name.trim();
    if (trimmed !== "" && trimmed !== playlist.name) {
      await updatePlaylist({
        id: playlist.id,
        kind: playlist.kind,
        name: trimmed,
      });
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (deleting === null) {
      return;
    }

    const routeId = playlistRouteId(deleting);
    setDeleting(null);
    if ((await removePlaylist(deleting)) && routeId === selectedRouteId) {
      navigate("/playlists");
    }
  };

  return {
    playlists,
    playlistsState,
    selectedRouteId,
    editingRouteId,
    setEditingRouteId,
    deleting,
    setDeleting,
    creatingSmart,
    setCreatingSmart,
    query,
    setQuery,
    openPlaylist,
    create,
    createSmart,
    rename,
    confirmDelete,
  };
};
