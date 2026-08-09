import { Disc3, FolderInput, ListMusic, Settings, Users } from "lucide-react";
import { NavLink } from "react-router";
import { useT } from "@/features/i18n/useT";
import { importStore } from "@/features/import/importStore";
import { cn } from "@/libs/utils";

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

/**
 * Left sidebar: top navigation + a route-specific secondary area.
 *
 * The secondary area replaces audio-player's tab approach — its content is
 * decided by the active route and is filled in by the view issues
 * (artist list in Phase 4, album filters in Phase 5, playlists in Phase 6).
 */
export const Sidebar = () => {
  const t = useT();
  return (
    <aside className="flex flex-col overflow-hidden border-r bg-sidebar">
      <nav className="flex flex-col gap-1 p-2">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={linkClassName}>
            <Icon aria-hidden className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      {/* Route-specific secondary area (filled by each view's issue). */}
      <div className="flex-1 overflow-y-auto border-t p-2" />
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
