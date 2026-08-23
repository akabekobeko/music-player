import { useEffect } from "react";
import { useLocation } from "react-router";
import { lastViewOf } from "./lastViewOf";
import { lastViewStore } from "./lastViewStore";

/**
 * Feed the current main view (section + sidebar selection) into
 * `lastViewStore` whenever the route changes, which persists it for the
 * next launch and lets the Sidebar's tabs return to each section's last
 * selection.
 *
 * This is the one place where `useEffect` is the right tool
 * (`docs/specs/v1.0/renderer/state-management.md`): navigation originates
 * from many handlers (tab links, list panels, delete flows, history keys),
 * so syncing the router's location to the external store here is simpler
 * and safer than chasing every navigation site. Renders nothing.
 */
export const LastViewRecorder = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const view = lastViewOf(pathname);
    if (view !== null) {
      lastViewStore.record(view);
    }
  }, [pathname]);
  return null;
};
