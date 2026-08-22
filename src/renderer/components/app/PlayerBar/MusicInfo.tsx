import type { Music } from "@mp/ipc";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { Stack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";

type Props = {
  /** Current track; `null` shows the "no music" placeholder. */
  readonly music: Music | null;
};

/**
 * Two-line track info in a fixed-width column: title on top,
 * `artist - album` below (artist only when the album is unknown). Each line
 * is clipped with an ellipsis and reveals the full text in a tooltip.
 */
export const MusicInfo = ({ music }: Props) => {
  const t = useT();
  if (music === null) {
    return (
      <Stack className="w-56 shrink-0 gap-0.5">
        <EllipsisText
          className="text-muted-foreground text-sm"
          text={t("player.noMusic")}
        />
      </Stack>
    );
  }

  const artistAlbum =
    music.album !== "" ? `${music.artist} - ${music.album}` : music.artist;
  return (
    <Stack className="w-56 shrink-0 gap-0.5">
      <EllipsisText className="font-medium text-sm" text={music.title} />
      <EllipsisText
        className="text-muted-foreground text-xs"
        text={artistAlbum}
      />
    </Stack>
  );
};
