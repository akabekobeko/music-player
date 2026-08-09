import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "./formatTime";

/** Coerce Base UI's single-or-array slider value into a number. */
const asNumber = (value: number | readonly number[]): number =>
  Array.isArray(value) ? (value[0] ?? 0) : (value as number);

/**
 * Seek bar with optimistic updates
 * (`docs/specs/v1.0/features/player-ui.md`): while dragging, the local
 * value wins and the snapshot is ignored; on commit `onSeek` fires and the
 * snapshot takes over again. The engine keeps reporting the deferred-seek
 * target as `currentTime`, so the thumb never jumps back.
 */
export const SeekBar = ({
  currentTime,
  duration,
  displayDuration,
  seeking,
  onSeek,
}: {
  readonly currentTime: number;
  /** Engine duration; `0` = unknown, the slider is disabled until it resolves. */
  readonly duration: number;
  /**
   * Duration shown as the total-time label. Falls back to mme's value while
   * the engine has not resolved one (display only — never used for seeking).
   */
  readonly displayDuration: number;
  /** Deferred seek in progress — shows the spinner over the bar. */
  readonly seeking: boolean;
  readonly onSeek: (timeSec: number) => void;
}) => {
  const [dragValue, setDragValue] = useState<number | null>(null);
  const shown = dragValue ?? Math.min(currentTime, duration || currentTime);

  return (
    <div className="app-region-no-drag flex items-center gap-2">
      <span className="w-10 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
        {formatTime(shown)}
      </span>
      <div className="relative flex-1">
        <Slider
          aria-label="Seek"
          min={0}
          max={Math.max(1, Math.floor(duration))}
          step={1}
          disabled={duration <= 0}
          value={Math.floor(shown)}
          onValueChange={(value) => {
            setDragValue(asNumber(value));
          }}
          onValueCommitted={(value) => {
            onSeek(asNumber(value));
            setDragValue(null);
          }}
        />
        {seeking && (
          <Loader2 className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 size-3 animate-spin text-muted-foreground" />
        )}
      </div>
      <span className="w-10 font-mono text-[11px] text-muted-foreground tabular-nums">
        {formatTime(displayDuration)}
      </span>
    </div>
  );
};
