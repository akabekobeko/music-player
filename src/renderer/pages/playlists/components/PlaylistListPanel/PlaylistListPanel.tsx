import { ListMusic, Plus, Sparkles } from "lucide-react";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { HStack, Stack } from "@/components/app/stacks";
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
import { playlistRouteId } from "@/features/playlist/playlistRouteId";
import { cn } from "@/libs/utils";
import { SmartRulesDialog } from "../SmartRulesDialog/SmartRulesDialog";
import { usePlaylistListPanel } from "./usePlaylistListPanel";

/**
 * Playlist list in the Sidebar's secondary area
 * (`docs/specs/v1.0/features/playlist.md`): every playlist of both kinds,
 * "+ New playlist", inline rename, and deletion behind a confirmation
 * dialog. The selected playlist lives in the URL (`/playlists/<routeId>`).
 */
export const PlaylistListPanel = () => {
  const t = useT();
  const {
    playlists,
    playlistsState,
    selectedRouteId,
    editingRouteId,
    setEditingRouteId,
    deleting,
    setDeleting,
    creatingSmart,
    setCreatingSmart,
    openPlaylist,
    create,
    createSmart,
    rename,
    confirmDelete,
  } = usePlaylistListPanel();

  return (
    <Stack className="h-full gap-0">
      <Stack className="p-2">
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
      </Stack>
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
            <HStack
              key={routeId}
              className={cn(
                "group w-full px-2 py-1",
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
                  onClick={() => openPlaylist(routeId)}
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
            </HStack>
          );
        })}
      </div>

      {creatingSmart && (
        <SmartRulesDialog
          title={t("playlist.newSmart")}
          initialName={t("playlist.defaultName")}
          onClose={() => setCreatingSmart(false)}
          onSubmit={(rules, name) => void createSmart(rules, name)}
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
    </Stack>
  );
};
