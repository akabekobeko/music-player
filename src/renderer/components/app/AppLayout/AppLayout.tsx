import { Outlet } from "react-router";
import { ImportConfirmDialog } from "@/components/app/ImportConfirmDialog/ImportConfirmDialog";
import { PlayerBar } from "@/components/app/PlayerBar/PlayerBar";
import { Sidebar } from "@/components/app/Sidebar/Sidebar";

/**
 * Application frame (`docs/specs/v1.0/renderer/routing-layout.md`): a plain
 * CSS Grid with the PlayerBar band spanning the full width on top, the
 * Sidebar on the left, and the routed view in the remaining cell. No
 * react-resizable-panels — panel resizing waits for an actual request.
 */
export const AppLayout = () => (
  <div className="grid h-dvh grid-cols-[14rem_1fr] grid-rows-[auto_1fr] overflow-hidden">
    <PlayerBar />
    <Sidebar />
    <main className="overflow-y-auto">
      <Outlet />
    </main>
    <ImportConfirmDialog />
  </div>
);
