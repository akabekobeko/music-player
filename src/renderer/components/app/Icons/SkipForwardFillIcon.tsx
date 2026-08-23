import { type LucideProps, SkipForward } from "lucide-react";
import { cn } from "@/libs/utils";

/**
 * Skip to next track (solid).
 *
 * lucide draws outlines only, so the app-wide "solid" look lives here instead
 * of being repeated as `fill-current` at every call site.
 */
export const SkipForwardFillIcon = ({ className, ...props }: LucideProps) => (
  <SkipForward className={cn("fill-current", className)} {...props} />
);
