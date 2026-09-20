import { useSyncExternalStore } from "react";
import { useLocation } from "react-router";
import { sectionOf } from "@/features/layout/sectionOf";
import { sidebarStore } from "@/features/layout/sidebarStore";
import { trackFilterStore } from "@/features/trackFilter/trackFilterStore";

/**
 * Logic of `ContentToolbar`: the sidebar snapshot (the icon cluster moves
 * here while the sidebar is closed), and the song filter of the active
 * route's section — its draft text and the change handler — or `null`
 * when the route has no track list.
 */
export const useContentToolbar = () => {
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

  const filter =
    section === null
      ? null
      : {
          text: draft[section],
          setText: (text: string): void => {
            trackFilterStore.setText(section, text);
          },
        };

  return { sidebar, filter };
};
