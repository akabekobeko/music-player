import { FolderInput, Menu, PanelLeft, Settings } from "lucide-react";
import type { CSSProperties } from "react";
import { NavLink } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import { importStore } from "@/features/import/importStore/importStore";
import { sidebarStore } from "@/features/layout/sidebarStore";
import { getUiPlatform } from "@/libs/platform";
import { cn } from "@/libs/utils";
import { ClusterButton } from "./ClusterButton";

/** Delay before the tooltips show — an instant popup is distracting here. */
const TOOLTIP_DELAY_MS = 700;

type Props = {
  /** Host-specific sizing classes (the cluster has no width of its own). */
  readonly className?: string;
  /** Host-specific inline sizing, e.g. the persisted sidebar width. */
  readonly style?: CSSProperties;
};

/**
 * Icon cluster of the toolbar band
 * (`docs/specs/v1.0/renderer/routing-layout.md`): sidebar toggle, import and
 * settings, plus the application-menu button on Windows / Linux
 * (`docs/specs/v1.0/cross-platform/system-menu.md`).
 *
 * Lives in the sidebar toolbar while the sidebar is open and in the content
 * toolbar while it is closed. The host decides the width: the sidebar
 * toolbar lets it fill the (resizable) sidebar, the content toolbar sizes
 * it to the persisted sidebar width, so every icon — including the toggle
 * itself — keeps its screen position across a toggle:
 * - macOS: traffic-lights safe area on the left, then the icons.
 * - Windows / Linux: menu button on the left edge, the rest on the right.
 *
 * Vertically the buttons are centred on the OS window controls rather than
 * on the band: the cluster hugs the top of the band and is twice
 * `--toolbar-controls-center-y` tall, so its centre line is the controls'
 * centre line (two pixels above the band's centre on macOS, identical on
 * Windows / Linux where the overlay spans the whole band).
 */
export const ToolbarIconCluster = ({ className, style }: Props) => {
  const t = useT();
  const platform = getUiPlatform();
  return (
    <TooltipProvider delay={TOOLTIP_DELAY_MS}>
      <div
        className={cn(
          "flex h-[calc(var(--toolbar-controls-center-y)*2)] items-center gap-0.5 self-start pr-1.5 pl-[calc(var(--titlebar-safe-left)+0.375rem)]",
          className,
        )}
        style={style}
      >
        {platform !== "mac" && (
          <>
            <ClusterButton
              label={t("toolbar.menu")}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                window.mp.menu.popup({
                  x: Math.round(rect.left),
                  y: Math.round(rect.bottom),
                });
              }}
            >
              <Menu />
            </ClusterButton>
            <div className="flex-1" />
          </>
        )}
        <ClusterButton
          label={t("toolbar.toggleSidebar")}
          onClick={() => sidebarStore.toggle()}
        >
          <PanelLeft />
        </ClusterButton>
        <ClusterButton
          label={t("sidebar.import")}
          onClick={() => void importStore.openFromDialog()}
        >
          <FolderInput />
        </ClusterButton>
        <ClusterButton
          label={t("settings.title")}
          // The link is not a <button>; tell Base UI so it applies the
          // non-native semantics (role="button", key handling) instead of
          // warning about the missing native element.
          nativeButton={false}
          render={<NavLink to="/settings" />}
        >
          <Settings />
        </ClusterButton>
      </div>
    </TooltipProvider>
  );
};
