import { Music } from "lucide-react";
import { VStack } from "@/components/app/stacks";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";

type Props = {
  /** Artwork file path of the current track; `null` shows the placeholder. */
  readonly picturePath: string | null;
};

/**
 * Artwork thumbnail at the left edge of `PlayerBar`. Falls back to a muted
 * note icon when the track has no picture (or nothing is playing).
 */
export const Picture = ({ picturePath }: Props) =>
  picturePath !== null ? (
    <img
      src={toMediaFileUrl(picturePath)}
      alt=""
      className="size-12 shrink-0 rounded object-cover"
    />
  ) : (
    <VStack className="size-12 shrink-0 rounded bg-muted">
      <Music aria-hidden className="size-5 text-muted-foreground" />
    </VStack>
  );
