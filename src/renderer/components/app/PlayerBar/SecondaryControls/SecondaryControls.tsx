import { HStack } from "@/components/app/stacks";
import { QueuePopover } from "./QueuePopover";
import { VolumeControl } from "./VolumeControl";

type Props = {
  /** Current volume, `0`–`1`. */
  readonly volume: number;
  readonly onVolumeChange: (volume: number) => void;
};

/**
 * Right-edge controls of `PlayerBar` that are not part of transport:
 * the queue popover and the volume control.
 */
export const SecondaryControls = ({ volume, onVolumeChange }: Props) => (
  <HStack className="gap-0.5">
    <QueuePopover />
    <VolumeControl volume={volume} onChange={onVolumeChange} />
  </HStack>
);
