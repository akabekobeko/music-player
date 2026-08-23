import {
  type LucideProps,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/libs/utils";

/**
 * Filled variants of the lucide playback icons. lucide draws outlines only,
 * so the app-wide "solid" look for transport controls lives here instead of
 * being repeated as `fill-current` at every call site.
 */

/** Play (solid triangle). */
export const PlayIcon = ({ className, ...props }: LucideProps) => (
  <Play className={cn("fill-current", className)} {...props} />
);

/** Pause (solid bars). */
export const PauseIcon = ({ className, ...props }: LucideProps) => (
  <Pause className={cn("fill-current", className)} {...props} />
);

/** Skip to previous track (solid). */
export const SkipBackIcon = ({ className, ...props }: LucideProps) => (
  <SkipBack className={cn("fill-current", className)} {...props} />
);

/** Skip to next track (solid). */
export const SkipForwardIcon = ({ className, ...props }: LucideProps) => (
  <SkipForward className={cn("fill-current", className)} {...props} />
);

/**
 * Only the speaker body (first path) is filled — filling the sound-wave arcs
 * or the mute cross distorts the glyph.
 */
const speakerFill = "[&>path:first-child]:fill-current";

/** Speaker with sound waves (solid body). */
export const VolumeIcon = ({ className, ...props }: LucideProps) => (
  <Volume2 className={cn(speakerFill, className)} {...props} />
);

/** Muted speaker (solid body). */
export const VolumeMutedIcon = ({ className, ...props }: LucideProps) => (
  <VolumeX className={cn(speakerFill, className)} {...props} />
);
