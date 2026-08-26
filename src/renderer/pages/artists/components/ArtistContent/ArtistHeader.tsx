import type { Artist, Music } from "@mp/ipc";
import { Shuffle as ShuffleIcon, UserRound } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { CircleIconButton } from "@/components/app/Buttons/CircleIconButton";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { HStack, Spacer, VStack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";
import { artistEditStore } from "@/features/library/artistEditStore";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";

type Props = {
  readonly artistName: string;
  /** Library entry of the artist; `null` until loaded or for the unknown bucket. */
  readonly artist: Artist | null;
  readonly albumCount: number;
  /** The artist's full play order; also the "Add to playlist" target. */
  readonly playOrder: readonly Music[];
  readonly onPlayAll: () => void;
  readonly onPlayShuffled: () => void;
};

/**
 * Artist area: picture, name and counts on the left; play / shuffle / menu
 * circles on the right. The right padding matches the list's `px-6` plus
 * the rows' `pr-2`, so the menu lines up with the album / track menus.
 * The empty name is the "Unknown Artist" bucket — it renders with the
 * localised label and cannot be edited.
 */
export const ArtistHeader = ({
  artistName,
  artist,
  albumCount,
  playOrder,
  onPlayAll,
  onPlayShuffled,
}: Props) => {
  const t = useT();
  const musicCount = playOrder.length;

  return (
    <HStack className="gap-4 border-b py-4 pr-8 pl-6">
      {artist?.picturePath != null ? (
        <img
          src={toMediaFileUrl(artist.picturePath)}
          alt=""
          className="size-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <VStack className="size-16 shrink-0 rounded-full bg-muted">
          <UserRound aria-hidden className="size-7 text-muted-foreground" />
        </VStack>
      )}
      <div className="min-w-0">
        <h1 className="font-semibold text-lg">
          <EllipsisText
            text={artistName !== "" ? artistName : t("artist.unknown")}
          />
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("artist.albumCount", { count: albumCount })}
          {" · "}
          {t("artist.songs", { count: musicCount })}
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
          <PlayFillIcon className="size-3.5" />
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
            <AddToPlaylistSubmenu key="playlist" musics={playOrder} />,
            ...(artistName !== ""
              ? [
                  {
                    label: t("artistEdit.menu"),
                    onSelect: () =>
                      artistEditStore.open({
                        name: artistName,
                        picturePath: artist?.picturePath ?? null,
                        musicCount: artist?.musicCount ?? musicCount,
                        initial: artist?.initial ?? null,
                      }),
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
