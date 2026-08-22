import type { Artist, Music } from "@mp/ipc";
import { Play, Shuffle as ShuffleIcon, UserRound } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { HStack, Stack, VStack } from "@/components/app/stacks";
import { Button } from "@/components/ui/button";
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
 * Artist area: picture, name, counts, play / shuffle buttons and the menu.
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
    <header className="flex items-center gap-4 border-b px-6 py-4">
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
      <Stack className="min-w-0 flex-1">
        <div>
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
        <HStack>
          <Button size="sm" disabled={musicCount === 0} onClick={onPlayAll}>
            <Play /> {t("player.play")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={musicCount === 0}
            onClick={onPlayShuffled}
          >
            <ShuffleIcon /> {t("player.shuffle")}
          </Button>
        </HStack>
      </Stack>
      <span className="self-start">
        <RowMenu
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
                      }),
                    separatorBefore: true,
                  },
                ]
              : []),
          ]}
        />
      </span>
    </header>
  );
};
