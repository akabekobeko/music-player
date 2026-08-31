import { Disc3 } from "lucide-react";
import { useSyncExternalStore } from "react";
import { VStack } from "@/components/app/stacks";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/features/i18n/useT";
import { albumInfoStore } from "@/features/library/albumInfoStore";
import { formatTime } from "@/libs/formatTime";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";

/** Label + plain-text row for an album property (never editable). */
const PropertyRow = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) => (
  <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-2">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="break-all">{value}</span>
  </div>
);

/**
 * Album info dialog (album menu → "Album Info"), mounted once in the
 * AppLayout (the menu that started the flow is gone by the time this opens).
 *
 * Shows the artwork at the body's full width keeping its aspect ratio and
 * the summary-line facts of the Artist / Album views as separate rows.
 */
export const AlbumInfoDialog = () => {
  const t = useT();
  const album = useSyncExternalStore(
    albumInfoStore.subscribe,
    albumInfoStore.getSnapshot,
  );

  return (
    <Dialog
      open={album !== null}
      onOpenChange={(open) => {
        if (!open) {
          albumInfoStore.close();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("albumInfo.title")}</DialogTitle>
        </DialogHeader>
        {album !== null && (
          <DialogBody className="max-h-[65vh] overflow-y-auto">
            {album.picturePath !== null ? (
              <img
                src={toMediaFileUrl(album.picturePath)}
                alt=""
                className="w-full rounded-md"
              />
            ) : (
              <VStack className="aspect-square w-full rounded-md bg-muted">
                <Disc3 aria-hidden className="size-16 text-muted-foreground" />
              </VStack>
            )}
            <div className="grid gap-2">
              <PropertyRow
                label={t("albumInfo.field.album")}
                value={album.album}
              />
              <PropertyRow
                label={t("albumInfo.field.artist")}
                value={album.artist}
              />
              <PropertyRow
                label={t("albumInfo.field.year")}
                value={album.year !== null ? String(album.year) : ""}
              />
              <PropertyRow
                label={t("albumInfo.field.genre")}
                value={album.genre}
              />
              <PropertyRow
                label={t("albumInfo.field.songCount")}
                value={String(album.musicCount)}
              />
              <PropertyRow
                label={t("albumInfo.field.duration")}
                value={formatTime(album.totalDurationMs / 1000)}
              />
            </div>
          </DialogBody>
        )}
      </DialogContent>
    </Dialog>
  );
};
