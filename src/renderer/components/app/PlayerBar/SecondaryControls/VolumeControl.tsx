import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useT } from "@/features/i18n/useT";
import { GlowIconButton } from "../../Buttons/GlowIconButton";
import { VolumeFillIcon } from "../../Icons/VolumeFillIcon";
import { VolumeMutedFillIcon } from "../../Icons/VolumeMutedFillIcon";
import { HStack } from "../../stacks";
import { useVolumeControl } from "./useVolumeControl";

type Props = {
  /** Current volume in `[0, 1]`. */
  readonly volume: number;
  /**
   * Called with the new volume in `[0, 1]` on every slider move and on
   * the mute toggle (mute sends `0`, unmute the remembered level).
   */
  readonly onChange: (volume: number) => void;
};

/**
 * Volume popover (`docs/specs/v1.0/features/player-ui.md`): a 0–100 slider
 * over the internal `[0, 1]` volume, plus a mute toggle that remembers the
 * last audible level (`useVolumeControl`).
 */
export const VolumeControl = ({ volume, onChange }: Props) => {
  const t = useT();
  const { muted, percent, toggleMute, setPercent } = useVolumeControl(
    volume,
    onChange,
  );

  return (
    <Popover>
      <PopoverTrigger
        render={<GlowIconButton aria-label={t("player.volume")} />}
      >
        {muted ? <VolumeMutedFillIcon /> : <VolumeFillIcon />}
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <HStack>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={muted ? t("player.unmute") : t("player.mute")}
            onClick={toggleMute}
          >
            {muted ? <VolumeMutedFillIcon /> : <VolumeFillIcon />}
          </Button>
          <Slider
            appearance="fused"
            aria-label={t("player.volume")}
            min={0}
            max={100}
            step={1}
            value={percent}
            onValueChange={setPercent}
          />
          <span className="w-8 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
            {percent}
          </span>
        </HStack>
      </PopoverContent>
    </Popover>
  );
};
