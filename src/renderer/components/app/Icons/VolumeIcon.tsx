import { type LucideProps, Volume2 } from "lucide-react";
import { cn } from "@/libs/utils";

/**
 * Speaker with sound waves. Only the speaker body (first path) is filled —
 * filling the sound-wave arcs distorts the glyph.
 *
 * lucide draws outlines only, so the app-wide "solid" look lives here instead
 * of being repeated as `fill-current` at every call site.
 */
export const VolumeIcon = ({ className, ...props }: LucideProps) => (
  <Volume2
    className={cn("[&>path:first-child]:fill-current", className)}
    {...props}
  />
);
