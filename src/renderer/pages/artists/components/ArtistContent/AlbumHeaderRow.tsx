import type { Music } from "@mp/ipc";
import { Disc3 } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { HStack, VStack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";
import type { AlbumGroup } from "@/features/library/groupAlbums/types";
import { libraryRemoveStore } from "@/features/library/libraryRemoveStore";
import { formatTime } from "@/libs/formatTime";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";

type Props = {
  readonly group: AlbumGroup;
  /** The album's tracks in disc / track order (menu targets). */
  readonly musics: readonly Music[];
  readonly onPlay: () => void;
  readonly onAddToQueue: () => void;
};

/**
 * Album area: the heading row of one album (artwork, title, summary line,
 * album menu) that precedes its tracks in the virtualised list.
 */
export const AlbumHeaderRow = ({
  group,
  musics,
  onPlay,
  onAddToQueue,
}: Props) => {
  const t = useT();

  return (
    <HStack className="items-end gap-4 pt-6 pr-2 pb-4">
      {group.picturePath !== null ? (
        <img
          src={toMediaFileUrl(group.picturePath)}
          alt=""
          className="size-28 shrink-0 rounded-md object-cover"
        />
      ) : (
        <VStack className="size-28 shrink-0 rounded-md bg-muted">
          <Disc3 aria-hidden className="size-10 text-muted-foreground" />
        </VStack>
      )}
      <div className="min-w-0 flex-1 pb-1">
        <h2 className="font-medium text-base">
          <EllipsisText text={group.album} />
        </h2>
        <EllipsisText
          className="text-muted-foreground text-xs"
          text={[
            group.year !== null ? String(group.year) : null,
            group.genre !== "" ? group.genre : null,
            t("artist.songs", { count: group.musicCount }),
            formatTime(group.totalDurationMs / 1000),
          ]
            .filter((part) => part !== null)
            .join(" · ")}
        />
      </div>
      <RowMenu
        triggerClassName="rounded-full bg-foreground text-background hover:bg-foreground/80 hover:text-background dark:hover:bg-foreground/80"
        items={[
          { label: t("player.play"), onSelect: onPlay },
          { label: t("menu.addToQueue"), onSelect: onAddToQueue },
          <AddToPlaylistSubmenu key="playlist" musics={musics} />,
          {
            label: t("menu.removeFromLibrary"),
            onSelect: () =>
              libraryRemoveStore.open({
                kind: "album",
                albumKey: group.key,
                album: group.album,
              }),
            destructive: true,
            separatorBefore: true,
          },
        ]}
      />
    </HStack>
  );
};
