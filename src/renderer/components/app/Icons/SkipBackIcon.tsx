import { type LucideProps, SkipBack } from "lucide-react";
import { cn } from "@/libs/utils";

/**
 * Skip to previous track (solid).
 *
 * lucide draws outlines only, so the app-wide "solid" look lives here instead
 * of being repeated as `fill-current` at every call site.
 */
export const SkipBackIcon = ({ className, ...props }: LucideProps) => (
  <SkipBack className={cn("fill-current", className)} {...props} />
);
