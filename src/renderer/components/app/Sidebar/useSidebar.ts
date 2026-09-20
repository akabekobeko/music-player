import type { ViewSection } from "@mp/ipc";
import { useSyncExternalStore } from "react";
import { useLocation } from "react-router";
import { lastViewPath } from "@/features/layout/lastView/lastViewPath";
import { lastViewStore } from "@/features/layout/lastView/lastViewStore";
import { sectionOf } from "@/features/layout/sectionOf";

/**
 * Logic of `Sidebar`: the section of the active route (decided by the
 * route prefix, not the exact path) and, per section, the path of its
 * last sidebar selection (`lastViewStore`) so switching back and forth
 * returns to the artist / playlist the user had open.
 */
export const useSidebar = () => {
  const { pathname } = useLocation();
  const lastView = useSyncExternalStore(
    lastViewStore.subscribe,
    lastViewStore.getSnapshot,
  );

  const activeSection = sectionOf(pathname);

  /** Path the section's tab links to: its last selection. */
  const pathOf = (section: ViewSection): string =>
    lastViewPath({ ...lastView, section });

  return { activeSection, pathOf };
};
