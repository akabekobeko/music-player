import { useEffect } from "react";
import { useLocation } from "react-router";
import { lastViewOf } from "./lastViewOf";

/**
 * Persist the current main view (section + sidebar selection) as
 * `AppSettings.lastView` whenever the route changes, so the next launch can
 * restore it (`restoreLastView`).
 *
 * This is the one place where `useEffect` is the right tool
 * (`docs/specs/v1.0/renderer/state-management.md`): navigation originates
 * from many handlers (`NavLink`s, list panels, delete flows, history keys),
 * so syncing the router's location to the external settings store here is
 * simpler and safer than chasing every navigation site. Renders nothing.
 */
export const LastViewRecorder = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const view = lastViewOf(pathname);
    if (view !== null) {
      void window.mp.settings.set({ patch: { lastView: view } });
    }
  }, [pathname]);
  return null;
};
