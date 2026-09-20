import { Disc3, ListMusic, Users } from "lucide-react";
import { Link } from "react-router";
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
import { SidebarToolbar } from "../Toolbar/SidebarToolbar";
import { useSidebar } from "./useSidebar";

/** Primary navigation entries (`docs/specs/v1.0/renderer/routing-layout.md`). */
const NAV_ITEMS = [
  { section: "artists", label: "Artists", Icon: Users },
  { section: "albums", label: "Albums", Icon: Disc3 },
  { section: "playlists", label: "Playlists", Icon: ListMusic },
] as const;

/**
 * Classes for the horizontal mode-switch tabs. Both states light the border
 * up with a blurred glow like `CircleIconButton` / `InitialGrid`, and the
 * glow strength is set by the border thickness: hover adds a 1px spread ring
 * on top of the border (the `CircleIconButton` treatment), so it reads as a
 * thicker, stronger lamp; the active tab keeps only the plain border plus
 * the blur (the `InitialGrid` selected treatment), so it stays visible once
 * the pointer leaves without competing with the hovered tab.
 */
const tabClassName = (isActive: boolean): string =>
  cn(
    "flex items-center justify-center rounded-md border border-transparent py-1.5 transition-[color,background-color,border-color,box-shadow] duration-200",
    "hover:border-foreground hover:text-foreground",
    "hover:shadow-[0_0_0_1px_var(--foreground),0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
    isActive
      ? "border-foreground bg-background text-foreground shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]"
      : "text-muted-foreground",
  );

/**
 * Left sidebar: the title-bar-height toolbar on top, horizontal mode-switch
 * tabs (audio-player style) below it, then a route-specific secondary area
 * whose content is decided by the active route (artist list, album filters,
 * playlists). Import / Settings moved into the toolbar's icon cluster.
 *
 * Each tab links to its section's last sidebar selection and the active
 * tab follows the route prefix (`useSidebar`).
 */
export const Sidebar = () => {
  const { activeSection, pathOf } = useSidebar();
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
                      to={pathOf(section)}
                      aria-label={label}
                      aria-current={
                        section === activeSection ? "page" : undefined
                      }
                      className={tabClassName(section === activeSection)}
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
        {activeSection === "artists" && <ArtistListPanel />}
        {activeSection === "albums" && <AlbumFilterPanel />}
        {activeSection === "playlists" && <PlaylistListPanel />}
      </div>
    </aside>
  );
};
