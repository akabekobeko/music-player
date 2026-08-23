import { type LucideProps, Play } from "lucide-react";
import { cn } from "@/libs/utils";

/**
 * Play (solid triangle).
 *
 * lucide draws outlines only, so the app-wide "solid" look lives here instead
 * of being repeated as `fill-current` at every call site.
 */
export const PlayFillIcon = ({ className, ...props }: LucideProps) => (
  <Play className={cn("fill-current", className)} {...props} />
);
