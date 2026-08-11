import { Disc3, FolderInput, ListMusic, Settings, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import { importStore } from "@/features/import/importStore/importStore";
import { cn } from "@/libs/utils";
import { AlbumFilterPanel } from "@/pages/albums/components/AlbumFilterPanel/AlbumFilterPanel";
import { ArtistListPanel } from "@/pages/artists/components/ArtistListPanel/ArtistListPanel";
import { PlaylistListPanel } from "@/pages/playlists/components/PlaylistListPanel/PlaylistListPanel";

/** Primary navigation entries (`docs/specs/v1.0/renderer/routing-layout.md`). */
const NAV_ITEMS = [
  { to: "/artists", label: "Artists", Icon: Users },
  { to: "/albums", label: "Albums", Icon: Disc3 },
  { to: "/playlists", label: "Playlists", Icon: ListMusic },
] as const;

/** Shared classes for every sidebar navigation link. */
const linkClassName = ({ isActive }: { isActive: boolean }): string =>
  cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
  );

/** Classes for the horizontal mode-switch tabs (styled after audio-player). */
const tabClassName = ({ isActive }: { isActive: boolean }): string =>
  cn(
    "flex items-center justify-center rounded-md py-1.5 transition-colors",
    isActive
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
  );

/**
 * Left sidebar: horizontal mode-switch tabs on top (audio-player style) + a
 * route-specific secondary area whose content is decided by the active route
 * (artist list, album filters, playlists).
 */
export const Sidebar = () => {
  const t = useT();
  const { pathname } = useLocation();
  return (
    <aside className="flex flex-col overflow-hidden border-r bg-sidebar">
      <TooltipProvider>
        {/* Padded wrapper instead of margin on the nav pill: the sibling
            secondary area's border-t must keep spanning edge to edge. */}
        <div className="p-2">
          <nav className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <Tooltip key={to}>
                <TooltipTrigger
                  render={
                    <NavLink
                      to={to}
                      aria-label={label}
                      className={tabClassName}
                    >
                      <Icon aria-hidden className="size-4" />
                    </NavLink>
                  }
                />
                <TooltipContent side="bottom">{label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
        </div>
      </TooltipProvider>
      {/* Route-specific secondary area. */}
      <div className="flex-1 overflow-hidden border-t">
        {pathname.startsWith("/artists") && <ArtistListPanel />}
        {pathname.startsWith("/albums") && <AlbumFilterPanel />}
        {pathname.startsWith("/playlists") && <PlaylistListPanel />}
      </div>
      <nav className="flex flex-col gap-1 border-t p-2">
        <button
          type="button"
          className={cn(linkClassName({ isActive: false }), "text-left")}
          onClick={() => void importStore.openFromDialog()}
        >
          <FolderInput aria-hidden className="size-4" />
          {t("sidebar.import")}
        </button>
        <NavLink to="/settings" className={linkClassName}>
          <Settings aria-hidden className="size-4" />
          Settings
        </NavLink>
      </nav>
    </aside>
  );
};
