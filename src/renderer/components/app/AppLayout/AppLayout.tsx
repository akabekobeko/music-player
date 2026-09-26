import { Outlet } from "react-router";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { LastViewRecorder } from "@/features/layout/lastView/LastViewRecorder";
import {
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "@/features/layout/sidebarStore";
import { AboutDialog } from "../AboutDialog/AboutDialog";
import { NewPlaylistDialog } from "../AddToPlaylistSubmenu/NewPlaylistDialog";
import { FetchInfoDialog } from "../FetchInfoDialog/FetchInfoDialog";
import { ImportConfirmDialog } from "../ImportConfirmDialog/ImportConfirmDialog";
import { AlbumInfoDialog } from "../InfoDialog/AlbumInfoDialog/AlbumInfoDialog";
import { ArtistEditDialog } from "../InfoDialog/ArtistEditDialog/ArtistEditDialog";
import { MusicInfoDialog } from "../InfoDialog/MusicInfoDialog/MusicInfoDialog";
import { LibraryRemoveDialog } from "../LibraryRemoveDialog/LibraryRemoveDialog";
import { PlayerBar } from "../PlayerBar/PlayerBar";
import { Sidebar } from "../Sidebar/Sidebar";
import { Toaster } from "../Toaster/Toaster";
import { ContentToolbar } from "../Toolbar/ContentToolbar";
import { useAppLayout } from "./useAppLayout";

/**
 * Application frame (`docs/specs/v1.0/renderer/routing-layout.md`): a
 * horizontal ResizablePanelGroup with the collapsible Sidebar on the left,
 * the routed view under its toolbar in the remaining panel, and the
 * PlayerBar band spanning the full width at the bottom. Sidebar and content
 * area each carry their own title-bar-height toolbar (window drag region +
 * OS window controls).
 *
 * The sidebar keeps its pixel width when the window resizes
 * (`preserve-pixel-size`); the width persistence is in `useAppLayout`.
 */
export const AppLayout = () => {
  const { sidebar, onSidebarResize, onLayoutChanged } = useAppLayout();
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <LastViewRecorder />
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 flex-1"
        onLayoutChanged={onLayoutChanged}
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
              onResize={onSidebarResize}
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
      <FetchInfoDialog />
      <NewPlaylistDialog />
      <ArtistEditDialog />
      <MusicInfoDialog />
      <AlbumInfoDialog />
      <LibraryRemoveDialog />
      <AboutDialog />
      <Toaster />
    </div>
  );
};
