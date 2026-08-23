import type { Music } from "@mp/ipc";
import { ListMusic, Shuffle as ShuffleIcon } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { CircleIconButton } from "@/components/app/Buttons/CircleIconButton";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { PlayIcon } from "@/components/app/Icons/PlayIcon";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { HStack, Spacer, VStack } from "@/components/app/stacks";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/features/i18n/useT";
import { formatTime } from "@/libs/formatTime";

type Props = {
  readonly name: string;
  readonly smart: boolean;
  /** Visible tracks in play order; also the "Add to playlist" target. */
  readonly musics: readonly Music[];
  readonly totalDurationMs: number;
  readonly onPlayAll: () => void;
  readonly onPlayShuffled: () => void;
  /** Opens the smart-rules editor; only used when `smart` is true. */
  readonly onEditRules: () => void;
};

/**
 * Playlist area laid out like `ArtistHeader`: icon, name and counts on the
 * left; play / shuffle / menu circles on the right. The right padding matches
 * the list's `px-6` plus the rows' `pr-2`, so the menu lines up with the
 * track menus. Smart playlists expose "Edit rules" from the menu.
 */
export const PlaylistHeader = ({
  name,
  smart,
  musics,
  totalDurationMs,
  onPlayAll,
  onPlayShuffled,
  onEditRules,
}: Props) => {
  const t = useT();
  const musicCount = musics.length;

  return (
    <HStack className="gap-4 border-b py-4 pr-8 pl-6">
      <VStack className="size-16 shrink-0 rounded-md bg-muted">
        <ListMusic aria-hidden className="size-7 text-muted-foreground" />
      </VStack>
      <div className="min-w-0">
        <h1 className="flex min-w-0 items-center gap-2 font-semibold text-lg">
          <EllipsisText className="min-w-0" text={name} />
          {smart && (
            <Badge variant="secondary">{t("playlist.smartBadge")}</Badge>
          )}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("artist.songs", { count: musicCount })}
          {" · "}
          {formatTime(totalDurationMs / 1000)}
        </p>
      </div>
      <Spacer />
      <HStack className="shrink-0">
        <CircleIconButton
          aria-label={t("player.play")}
          title={t("player.play")}
          disabled={musicCount === 0}
          onClick={onPlayAll}
        >
          <PlayIcon />
        </CircleIconButton>
        <CircleIconButton
          aria-label={t("player.shuffle")}
          title={t("player.shuffle")}
          disabled={musicCount === 0}
          onClick={onPlayShuffled}
        >
          <ShuffleIcon />
        </CircleIconButton>
        <RowMenu
          variant="circle"
          items={[
            { label: t("player.play"), onSelect: onPlayAll },
            { label: t("player.shuffle"), onSelect: onPlayShuffled },
            <AddToPlaylistSubmenu key="playlist" musics={musics} />,
            ...(smart
              ? [
                  {
                    label: t("smart.editRules"),
                    onSelect: onEditRules,
                    separatorBefore: true,
                  },
                ]
              : []),
          ]}
        />
      </HStack>
    </HStack>
  );
};
