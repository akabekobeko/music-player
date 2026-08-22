import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { HStack } from "@/components/app/stacks";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useT } from "@/features/i18n/useT";

/** Coerce Base UI's single-or-array slider value into a number. */
const asNumber = (value: number | readonly number[]): number =>
  Array.isArray(value) ? (value[0] ?? 0) : (value as number);

type Props = {
  /** Current volume in `[0, 1]`. */
  readonly volume: number;
  readonly onChange: (volume: number) => void;
};

/**
 * Volume popover (`docs/specs/v1.0/features/player-ui.md`): a 0–100 slider
 * over the internal `[0, 1]` volume, plus a mute toggle that remembers the
 * last audible level.
 */
export const VolumeControl = ({ volume, onChange }: Props) => {
  const t = useT();
  const [lastAudible, setLastAudible] = useState(1);
  const muted = volume === 0;

  const toggleMute = (): void => {
    if (muted) {
      onChange(lastAudible > 0 ? lastAudible : 1);
    } else {
      setLastAudible(volume);
      onChange(0);
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("player.volume")}
          />
        }
      >
        {muted ? <VolumeX /> : <Volume2 />}
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <HStack>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={muted ? t("player.unmute") : t("player.mute")}
            onClick={toggleMute}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
          <Slider
            variant="fused"
            aria-label={t("player.volume")}
            min={0}
            max={100}
            step={1}
            value={Math.round(volume * 100)}
            onValueChange={(value) => {
              onChange(asNumber(value) / 100);
            }}
          />
          <span className="w-8 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
            {Math.round(volume * 100)}
          </span>
        </HStack>
      </PopoverContent>
    </Popover>
  );
};
