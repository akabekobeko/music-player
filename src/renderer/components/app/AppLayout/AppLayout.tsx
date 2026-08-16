import { useSyncExternalStore } from "react";
import { Outlet } from "react-router";
import { AboutDialog } from "@/components/app/AboutDialog/AboutDialog";
import { NewPlaylistDialog } from "@/components/app/AddToPlaylistSubmenu/NewPlaylistDialog";
import { ArtistEditDialog } from "@/components/app/ArtistEditDialog/ArtistEditDialog";
import { ImportConfirmDialog } from "@/components/app/ImportConfirmDialog/ImportConfirmDialog";
import { PlayerBar } from "@/components/app/PlayerBar/PlayerBar";
import { Sidebar } from "@/components/app/Sidebar/Sidebar";
import { Toaster } from "@/components/app/Toaster/Toaster";
import { ContentToolbar } from "@/components/app/Toolbar/ContentToolbar";
import { sidebarStore } from "@/features/layout/sidebarStore";

/**
 * Application frame (`docs/specs/v1.0/renderer/routing-layout.md`): a plain
 * CSS Grid with the collapsible Sidebar on the left, the routed view under
 * its toolbar in the remaining cell, and the PlayerBar band spanning the
 * full width at the bottom. Sidebar and content area each carry their own
 * title-bar-height toolbar (window drag region + OS window controls). No
 * react-resizable-panels — panel resizing waits for an actual request.
 */
export const AppLayout = () => {
  const sidebarOpen = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
  );
  return (
    <div className="grid h-dvh grid-cols-[auto_1fr] grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      {sidebarOpen && <Sidebar />}
      <div className="col-start-2 flex min-h-0 flex-col">
        <ContentToolbar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <PlayerBar />
      <ImportConfirmDialog />
      <NewPlaylistDialog />
      <ArtistEditDialog />
      <AboutDialog />
      <Toaster />
    </div>
  );
};
