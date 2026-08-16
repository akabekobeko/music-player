import { useRef, useSyncExternalStore } from "react";
import { Outlet } from "react-router";
import { AboutDialog } from "@/components/app/AboutDialog/AboutDialog";
import { NewPlaylistDialog } from "@/components/app/AddToPlaylistSubmenu/NewPlaylistDialog";
import { ArtistEditDialog } from "@/components/app/ArtistEditDialog/ArtistEditDialog";
import { ImportConfirmDialog } from "@/components/app/ImportConfirmDialog/ImportConfirmDialog";
import { PlayerBar } from "@/components/app/PlayerBar/PlayerBar";
import { Sidebar } from "@/components/app/Sidebar/Sidebar";
import { Toaster } from "@/components/app/Toaster/Toaster";
import { ContentToolbar } from "@/components/app/Toolbar/ContentToolbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  sidebarStore,
} from "@/features/layout/sidebarStore";

/**
 * Application frame (`docs/specs/v1.0/renderer/routing-layout.md`): a
 * horizontal ResizablePanelGroup with the collapsible Sidebar on the left,
 * the routed view under its toolbar in the remaining panel, and the
 * PlayerBar band spanning the full width at the bottom. Sidebar and content
 * area each carry their own title-bar-height toolbar (window drag region +
 * OS window controls).
 *
 * The sidebar keeps its pixel width when the window resizes
 * (`preserve-pixel-size`). Width persistence goes through `sidebarStore`:
 * `onResize` fires per pointer move, so it only records the latest width in
 * a ref, and `onLayoutChanged` — which waits for the pointer release —
 * commits it (skipping non-interactive layout changes such as mount).
 */
export const AppLayout = () => {
  const sidebar = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
  );
  const draggedWidth = useRef(sidebar.width);
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 flex-1"
        onLayoutChanged={(_layout, meta) => {
          if (meta.isUserInteraction) {
            sidebarStore.setWidth(draggedWidth.current);
          }
        }}
      >
        {sidebar.open && (
          <>
            <ResizablePanel
              id="sidebar"
              className="flex min-w-0 flex-col"
              defaultSize={sidebar.width}
              minSize={SIDEBAR_MIN_WIDTH}
              maxSize={SIDEBAR_MAX_WIDTH}
              groupResizeBehavior="preserve-pixel-size"
              onResize={(size) => {
                draggedWidth.current = size.inPixels;
              }}
            >
              <Sidebar />
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}
        <ResizablePanel id="content" className="flex min-w-0 flex-col">
          <ContentToolbar />
          <main className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
      <PlayerBar />
      <ImportConfirmDialog />
      <NewPlaylistDialog />
      <ArtistEditDialog />
      <AboutDialog />
      <Toaster />
    </div>
  );
};
