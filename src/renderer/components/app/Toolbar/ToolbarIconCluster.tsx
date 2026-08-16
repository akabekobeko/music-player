import { FolderInput, Menu, PanelLeft, Settings } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { NavLink } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import { importStore } from "@/features/import/importStore/importStore";
import { sidebarStore } from "@/features/layout/sidebarStore";
import { getUiPlatform } from "@/libs/platform";

/**
 * Icon cluster of the toolbar band
 * (`docs/specs/v1.0/renderer/routing-layout.md`): sidebar toggle, import and
 * settings, plus the application-menu button on Windows / Linux
 * (`docs/specs/v1.0/cross-platform/system-menu.md`).
 *
 * Lives in the sidebar toolbar while the sidebar is open and in the content
 * toolbar while it is closed. The fixed sidebar width (`w-56`) and the
 * per-platform arrangement are identical in both hosts, so every icon —
 * including the toggle itself — keeps its screen position across a toggle:
 * - macOS: traffic-lights safe area on the left, then the icons.
 * - Windows / Linux: menu button on the left edge, the rest on the right.
 */
export const ToolbarIconCluster = () => {
  const t = useT();
  const platform = getUiPlatform();
  return (
    <TooltipProvider delay={TOOLTIP_DELAY_MS}>
      <div className="flex h-full w-56 shrink-0 items-center gap-0.5 pr-1.5 pl-[calc(var(--titlebar-safe-left)+0.375rem)]">
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
          render={<NavLink to="/settings" />}
        >
          <Settings />
        </ClusterButton>
      </div>
    </TooltipProvider>
  );
};

/** Delay before the tooltips show — an instant popup is distracting here. */
const TOOLTIP_DELAY_MS = 700;

type ClusterButtonProps = Pick<
  ComponentProps<typeof Button>,
  "onClick" | "render"
> & {
  /** Tooltip text, doubling as the accessible name. */
  readonly label: string;
  /** The icon. */
  readonly children: ReactNode;
};

/** One icon-only toolbar button with its delayed tooltip. */
const ClusterButton = ({ label, children, ...props }: ClusterButtonProps) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="app-region-no-drag"
          {...props}
        >
          {children}
        </Button>
      }
    />
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);
