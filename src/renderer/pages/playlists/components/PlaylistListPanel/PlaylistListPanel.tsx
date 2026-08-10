import type { Playlist } from "@mp/ipc";
import { ListMusic, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useMatch, useNavigate } from "react-router";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { queryKeys } from "@/features/library/queryStore";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import {
  createSmartPlaylist,
  createStaticPlaylist,
  removePlaylist,
  updatePlaylist,
} from "@/features/playlist/playlistCommands";
import { playlistRouteId } from "@/features/playlist/routeId";
import { cn } from "@/libs/utils";
import { SmartRulesDialog } from "../SmartRulesDialog/SmartRulesDialog";

/**
 * Playlist list in the Sidebar's secondary area
 * (`docs/specs/v1.0/features/playlist.md`): every playlist of both kinds,
 * "+ New playlist", inline rename, and deletion behind a confirmation
 * dialog. The selected playlist lives in the URL (`/playlists/<routeId>`).
 */
export const PlaylistListPanel = () => {
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

  const playlists =
    playlistsState.status === "success" ? playlistsState.value : [];

  const create = async (): Promise<void> => {
    const created = await createStaticPlaylist(t("playlist.defaultName"));
    if (created !== null) {
      const routeId = playlistRouteId(created);
      navigate(`/playlists/${routeId}`);
      setEditingRouteId(routeId); // Name straight away — inline edit.
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-1 p-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => void create()}
        >
          <Plus /> {t("playlist.new")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setCreatingSmart(true)}
        >
          <Sparkles /> {t("playlist.newSmart")}
        </Button>
      </div>
      {playlistsState.status === "error" && (
        <p className="break-all px-3 py-2 text-destructive text-xs">
          {t("library.loadFailed", { message: playlistsState.error.message })}
        </p>
      )}
      {playlistsState.status === "success" && playlists.length === 0 && (
        <p className="px-3 py-2 text-muted-foreground text-xs">
          {t("playlist.empty")}
        </p>
      )}
      <div className="flex-1 overflow-y-auto">
        {playlists.map((playlist) => {
          const routeId = playlistRouteId(playlist);
          const selected = routeId === selectedRouteId;
          return (
            <div
              key={routeId}
              className={cn(
                "group flex w-full items-center gap-2 px-2 py-1",
                selected
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
              )}
            >
              {playlist.kind === "smart" ? (
                <Sparkles
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
              ) : (
                <ListMusic
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
              )}
              {editingRouteId === routeId ? (
                <Input
                  autoFocus
                  defaultValue={playlist.name}
                  className="h-6 flex-1 text-sm"
                  onFocus={(event) => event.target.select()}
                  onBlur={(event) => void rename(playlist, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void rename(playlist, event.currentTarget.value);
                    } else if (event.key === "Escape") {
                      setEditingRouteId(null);
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate py-1 text-left text-sm"
                  onClick={() => navigate(`/playlists/${routeId}`)}
                  onDoubleClick={() => setEditingRouteId(routeId)}
                >
                  {playlist.name}
                </button>
              )}
              <span
                className={cn(
                  "shrink-0",
                  !selected && "opacity-0 group-hover:opacity-100",
                )}
              >
                <RowMenu
                  items={[
                    {
                      label: t("menu.rename"),
                      onSelect: () => setEditingRouteId(routeId),
                    },
                    {
                      label: t("playlist.delete"),
                      onSelect: () => setDeleting(playlist),
                      destructive: true,
                      separatorBefore: true,
                    },
                  ]}
                />
              </span>
            </div>
          );
        })}
      </div>

      {creatingSmart && (
        <SmartRulesDialog
          title={t("playlist.newSmart")}
          initialName={t("playlist.defaultName")}
          onClose={() => setCreatingSmart(false)}
          onSubmit={(rules, name) => {
            setCreatingSmart(false);
            void (async () => {
              const created = await createSmartPlaylist(
                name !== "" ? name : t("playlist.defaultName"),
                rules,
              );
              if (created !== null) {
                navigate(`/playlists/${playlistRouteId(created)}`);
              }
            })();
          }}
        />
      )}

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("playlist.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("playlist.deleteMessage", { name: deleting?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              {t("playlist.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
