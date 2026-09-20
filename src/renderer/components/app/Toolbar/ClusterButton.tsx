import type { ComponentProps, ReactNode } from "react";
import { GlowIconButton } from "@/components/app/Buttons/GlowIconButton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = Pick<
  ComponentProps<typeof GlowIconButton>,
  "onClick" | "render" | "nativeButton"
> & {
  /** Tooltip text, doubling as the accessible name. */
  readonly label: string;
  /** The icon. */
  readonly children: ReactNode;
};

/**
 * One glowing icon button of `ToolbarIconCluster` with its delayed tooltip
 * (the delay comes from the cluster's `TooltipProvider`).
 */
export const ClusterButton = ({ label, children, ...props }: Props) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <GlowIconButton
          aria-label={label}
          className="app-region-no-drag"
          {...props}
        >
          {children}
        </GlowIconButton>
      }
    />
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);
