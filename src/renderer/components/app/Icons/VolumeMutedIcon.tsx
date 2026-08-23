import { type LucideProps, VolumeX } from "lucide-react";
import { cn } from "@/libs/utils";

/**
 * Muted speaker. Only the speaker body (first path) is filled — filling the
 * mute cross distorts the glyph.
 *
 * lucide draws outlines only, so the app-wide "solid" look lives here instead
 * of being repeated as `fill-current` at every call site.
 */
export const VolumeMutedIcon = ({ className, ...props }: LucideProps) => (
  <VolumeX
    className={cn("[&>path:first-child]:fill-current", className)}
    {...props}
  />
);
