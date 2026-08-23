import { Disc3, ListMusic, Users } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router";
import { SidebarToolbar } from "@/components/app/Toolbar/SidebarToolbar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { lastViewPath } from "@/features/layout/lastView/lastViewPath";
import { lastViewStore } from "@/features/layout/lastView/lastViewStore";
import { cn } from "@/libs/utils";
import { AlbumFilterPanel } from "@/pages/albums/components/AlbumFilterPanel/AlbumFilterPanel";
import { ArtistListPanel } from "@/pages/artists/components/ArtistListPanel/ArtistListPanel";
import { PlaylistListPanel } from "@/pages/playlists/components/PlaylistListPanel/PlaylistListPanel";

/** Primary navigation entries (`docs/specs/v1.0/renderer/routing-layout.md`). */
const NAV_ITEMS = [
  { section: "artists", label: "Artists", Icon: Users },
  { section: "albums", label: "Albums", Icon: Disc3 },
  { section: "playlists", label: "Playlists", Icon: ListMusic },
] as const;

/** Classes for the horizontal mode-switch tabs (styled after audio-player). */
const tabClassName = (isActive: boolean): string =>
  cn(
    "flex items-center justify-center rounded-md py-1.5 transition-all duration-400 ease-in-out",
    isActive
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
  );

/**
 * Left sidebar: the title-bar-height toolbar on top, horizontal mode-switch
 * tabs (audio-player style) below it, then a route-specific secondary area
 * whose content is decided by the active route (artist list, album filters,
 * playlists). Import / Settings moved into the toolbar's icon cluster.
 *
 * Each tab links to its section's last sidebar selection (`lastViewStore`),
 * so switching back and forth returns to the artist / playlist the user had
 * open; the active tab is decided by the route prefix, not the exact path.
 */
export const Sidebar = () => {
  const { pathname } = useLocation();
  const lastView = useSyncExternalStore(
    lastViewStore.subscribe,
    lastViewStore.getSnapshot,
  );
  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-hidden bg-sidebar">
      <SidebarToolbar />
      <TooltipProvider delay={1000}>
        <div className="p-2">
          <nav className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {NAV_ITEMS.map(({ section, label, Icon }) => (
              <Tooltip key={section}>
                <TooltipTrigger
                  render={
                    <Link
                      to={lastViewPath({ ...lastView, section })}
                      aria-label={label}
                      aria-current={
                        pathname.startsWith(`/${section}`) ? "page" : undefined
                      }
                      className={tabClassName(
                        pathname.startsWith(`/${section}`),
                      )}
                    >
                      <Icon aria-hidden className="size-4" />
                    </Link>
                  }
                />
                <TooltipContent side="bottom">{label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
        </div>
      </TooltipProvider>
      {/* Route-specific secondary area. */}
      <div className="flex-1 overflow-hidden">
        {pathname.startsWith("/artists") && <ArtistListPanel />}
        {pathname.startsWith("/albums") && <AlbumFilterPanel />}
        {pathname.startsWith("/playlists") && <PlaylistListPanel />}
      </div>
    </aside>
  );
};
