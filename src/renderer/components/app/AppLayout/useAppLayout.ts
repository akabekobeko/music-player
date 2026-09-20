import { useRef, useSyncExternalStore } from "react";
import type {
  Layout,
  LayoutChangedMeta,
  PanelSize,
} from "react-resizable-panels";
import { sidebarStore } from "@/features/layout/sidebarStore";

/**
 * Logic of `AppLayout`: the sidebar snapshot (open state and persisted
 * width) and the width persistence through `sidebarStore`. `onResize`
 * fires per pointer move, so it only records the latest width in a ref,
 * and `onLayoutChanged` — which waits for the pointer release — commits it
 * (skipping non-interactive layout changes such as mount).
 */
export const useAppLayout = () => {
  const sidebar = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
  );
  const draggedWidth = useRef(sidebar.width);

  const onSidebarResize = (size: PanelSize): void => {
    draggedWidth.current = size.inPixels;
  };

  const onLayoutChanged = (_layout: Layout, meta: LayoutChangedMeta): void => {
    if (meta.isUserInteraction) {
      sidebarStore.setWidth(draggedWidth.current);
    }
  };

  return { sidebar, onSidebarResize, onLayoutChanged };
};
