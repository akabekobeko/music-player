import { ToolbarIconCluster } from "./ToolbarIconCluster";

/**
 * Title-bar-height band on top of the sidebar
 * (`docs/specs/v1.0/renderer/routing-layout.md`). The background is a window
 * drag region; the icon cluster (menu / toggle / import / settings) opts its
 * buttons out. On macOS the traffic lights overlay the band's left edge.
 */
export const SidebarToolbar = () => (
  <div className="app-region-drag flex h-(--toolbar-height) shrink-0 items-center">
    <ToolbarIconCluster className="flex-1" />
  </div>
);
