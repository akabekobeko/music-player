import type { Artist, Music } from "@mp/ipc";
import { NotepadText, Shuffle as ShuffleIcon, UserRound } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { CircleIconButton } from "@/components/app/Buttons/CircleIconButton";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { HStack, Spacer, VStack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";
import { artistEditStore } from "@/features/library/artistEditStore";
import type { AlbumGroup } from "@/features/library/groupAlbums/types";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { AlbumIndexPicker } from "./AlbumIndexPicker";

type Props = {
  readonly artistName: string;
  /** Library entry of the artist; `null` until loaded or for the unknown bucket. */
  readonly artist: Artist | null;
  /** The artist's albums as listed (after the song filter); the index grid. */
  readonly groups: readonly AlbumGroup[];
  /** The artist's full play order; also the "Add to playlist" target. */
  readonly playOrder: readonly Music[];
  readonly onPlayAll: () => void;
  readonly onPlayShuffled: () => void;
  /** Scroll the list to the album with this key (album index grid). */
  readonly onJumpToAlbum: (albumKey: string) => void;
};

/**
 * Artist area: picture with a hover ▶ overlay, name and counts on the left;
 * album index / shuffle / menu circles on the right. The right padding
 * matches the list's `px-6` plus the rows' `pr-2`, so the menu lines up with
 * the album / track menus. The empty name is the "Unknown Artist" bucket — it renders with the
 * localised label and cannot be edited.
 */
export const ArtistHeader = ({
  artistName,
  artist,
  groups,
  playOrder,
  onPlayAll,
  onPlayShuffled,
  onJumpToAlbum,
}: Props) => {
  const t = useT();
  const musicCount = playOrder.length;

  return (
    <HStack className="gap-4 border-b py-4 pr-8 pl-6">
      <div className="group relative shrink-0">
        {artist?.picturePath != null ? (
          <img
            src={toMediaFileUrl(artist.picturePath)}
            alt=""
            className="size-16 rounded-full object-cover"
          />
        ) : (
          <VStack className="size-16 rounded-full bg-muted">
            <UserRound aria-hidden className="size-7 text-muted-foreground" />
          </VStack>
        )}
        <button
          type="button"
          aria-label={t("player.play")}
          title={t("player.play")}
          disabled={musicCount === 0}
          className="absolute inset-0 m-auto flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          onClick={onPlayAll}
        >
          <PlayFillIcon className="size-4" />
        </button>
      </div>
      <div className="min-w-0">
        <h1 className="font-semibold text-lg">
          <EllipsisText
            text={artistName !== "" ? artistName : t("artist.unknown")}
          />
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("artist.albumCount", { count: groups.length })}
          {" · "}
          {t("artist.songs", { count: musicCount })}
        </p>
      </div>
      <Spacer />
      <HStack className="shrink-0">
        <AlbumIndexPicker groups={groups} onSelect={onJumpToAlbum} />
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
            {
              label: t("player.play"),
              icon: <PlayFillIcon />,
              onSelect: onPlayAll,
            },
            {
              label: t("player.shuffle"),
              icon: <ShuffleIcon />,
              onSelect: onPlayShuffled,
            },
            <AddToPlaylistSubmenu key="playlist" musics={playOrder} />,
            ...(artistName !== ""
              ? [
                  {
                    label: t("artistEdit.menu"),
                    icon: <NotepadText />,
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
