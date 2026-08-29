import { ListMusic, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { CircleIconButton } from "@/components/app/Buttons/CircleIconButton";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import { playlistRouteId } from "@/features/playlist/playlistRouteId";
import { cn } from "@/libs/utils";
import { SmartRulesDialog } from "../SmartRulesDialog/SmartRulesDialog";
import { usePlaylistListPanel } from "./usePlaylistListPanel";

/**
 * Playlist list in the Sidebar's secondary area
 * (`docs/specs/v1.0/features/playlist.md`): a fixed header (name filter,
 * icon-only "New playlist" / "New smart playlist" with delayed tooltips),
 * every playlist of both kinds, inline rename, and deletion behind a
 * confirmation dialog. The selected playlist lives in the URL
 * (`/playlists/<routeId>`).
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
    query,
    setQuery,
    openPlaylist,
    create,
    createSmart,
    rename,
    confirmDelete,
  } = usePlaylistListPanel();

  return (
    <Stack className="h-full gap-0">
      <TooltipProvider delay={TOOLTIP_DELAY_MS}>
        <HStack className="shrink-0 p-2">
          <Input
            type="search"
            placeholder={t("playlist.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <HeaderButton label={t("playlist.new")} onClick={() => void create()}>
            <Plus />
          </HeaderButton>
          <HeaderButton
            label={t("playlist.newSmart")}
            onClick={() => setCreatingSmart(true)}
          >
            <Sparkles />
          </HeaderButton>
        </HStack>
      </TooltipProvider>
      {playlistsState.status === "error" && (
        <p className="break-all px-3 py-2 text-destructive text-xs">
          {t("library.loadFailed", { message: playlistsState.error.message })}
        </p>
      )}
      {playlistsState.status === "success" &&
        playlistsState.value.length === 0 && (
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
                  className="min-w-0 flex-1 py-1 text-left text-sm"
                  onClick={() => openPlaylist(routeId)}
                  onDoubleClick={() => setEditingRouteId(routeId)}
                >
                  <EllipsisText text={playlist.name} />
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
                      icon: <Pencil />,
                      onSelect: () => setEditingRouteId(routeId),
                    },
                    {
                      label: t("playlist.delete"),
                      icon: <Trash2 />,
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

/** Delay before the tooltips show — an instant popup is distracting here. */
const TOOLTIP_DELAY_MS = 700;

type HeaderButtonProps = Pick<
  ComponentProps<typeof CircleIconButton>,
  "onClick"
> & {
  /** Tooltip text, doubling as the accessible name. */
  readonly label: string;
  /** The icon. */
  readonly children: ReactNode;
};

/** One icon-only header button with its delayed tooltip. */
const HeaderButton = ({ label, children, ...props }: HeaderButtonProps) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <CircleIconButton className="shrink-0" aria-label={label} {...props}>
          {children}
        </CircleIconButton>
      }
    />
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);
