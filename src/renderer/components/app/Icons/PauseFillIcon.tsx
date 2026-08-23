import { type LucideProps, Pause } from "lucide-react";
import { cn } from "@/libs/utils";

/**
 * Pause (solid bars).
 *
 * lucide draws outlines only, so the app-wide "solid" look lives here instead
 * of being repeated as `fill-current` at every call site.
 */
export const PauseFillIcon = ({ className, ...props }: LucideProps) => (
  <Pause className={cn("fill-current", className)} {...props} />
);
