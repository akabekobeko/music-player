import { Disc3, ListMusic, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { SidebarToolbar } from "@/components/app/Toolbar/SidebarToolbar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

/** Classes for the horizontal mode-switch tabs (styled after audio-player). */
const tabClassName = ({ isActive }: { isActive: boolean }): string =>
  cn(
    "flex items-center justify-center rounded-md py-1.5 transition-colors",
    isActive
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
  );

/**
 * Left sidebar: the title-bar-height toolbar on top, horizontal mode-switch
 * tabs (audio-player style) below it, then a route-specific secondary area
 * whose content is decided by the active route (artist list, album filters,
 * playlists). Import / Settings moved into the toolbar's icon cluster.
 */
export const Sidebar = () => {
  const { pathname } = useLocation();
  return (
    <aside className="flex w-56 flex-col overflow-hidden border-r bg-sidebar">
      <SidebarToolbar />
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
    </aside>
  );
};
