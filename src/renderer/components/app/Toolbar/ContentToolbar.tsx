import { useSyncExternalStore } from "react";
import { useLocation } from "react-router";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { sidebarStore } from "@/features/layout/sidebarStore";
import {
  type TrackFilterSection,
  trackFilterStore,
} from "@/features/trackFilter/trackFilterStore";
import { ToolbarIconCluster } from "./ToolbarIconCluster";

/**
 * Title-bar-height band on top of the content area
 * (`docs/specs/v1.0/renderer/routing-layout.md`). The background is a window
 * drag region; on Windows / Linux the Window Controls Overlay occupies the
 * band's right corner, so everything right-aligned stays inside the
 * safe-area padding. While the sidebar is closed its icon cluster moves
 * here, keeping every icon's screen position across the toggle.
 */
export const ContentToolbar = () => {
  const t = useT();
  const sidebar = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
  );
  const { draft } = useSyncExternalStore(
    trackFilterStore.subscribe,
    trackFilterStore.getSnapshot,
  );
  const { pathname } = useLocation();
  const section = sectionOf(pathname);

  return (
    <div className="app-region-drag flex h-(--toolbar-height) shrink-0 items-center gap-2 border-b pr-[calc(var(--titlebar-safe-right)+0.375rem)]">
      {!sidebar.open && (
        <ToolbarIconCluster
          className="shrink-0"
          style={{ width: sidebar.width }}
        />
      )}
      <div className="min-w-0 flex-1" />
      {section !== null && (
        <Input
          type="search"
          value={draft[section]}
          placeholder={t("toolbar.filterSongs")}
          aria-label={t("toolbar.filterSongs")}
          className="app-region-no-drag h-7 w-56 shrink"
          onChange={(event) => {
            trackFilterStore.setText(section, event.target.value);
          }}
        />
      )}
    </div>
  );
};

/**
 * Map the active route to its song-filter section; `null` (no filter input)
 * for routes without a track list, e.g. settings.
 */
const sectionOf = (pathname: string): TrackFilterSection | null =>
  pathname.startsWith("/artists")
    ? "artists"
    : pathname.startsWith("/albums")
      ? "albums"
      : pathname.startsWith("/playlists")
        ? "playlists"
        : null;
