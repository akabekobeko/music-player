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
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { musicInfoStore } from "@/features/library/musicInfoStore";
import { formatTime } from "@/libs/formatTime";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";

/** Label + read-only input row for a (future-editable) tag field. */
const TagField = ({
  label,
  type = "text",
  value,
}: {
  readonly label: string;
  readonly type?: "text" | "number";
  readonly value: string | number | null;
}) => (
  <div className="grid grid-cols-[7.5rem_1fr] items-center gap-2">
    <span className="text-muted-foreground text-xs">{label}</span>
    <Input type={type} value={value ?? ""} aria-label={label} readOnly />
  </div>
);

/** Label + plain-text row for a file-derived property (never editable). */
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

/** ISO-8601 → locale-formatted date-time (raw string when unparsable). */
const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
};

/**
 * Track info dialog (track row menu → "Song info"), mounted once in the
 * AppLayout (the menu that started the flow is gone by the time this opens).
 *
 * Shows every user-facing column of the `musics` row: the artwork as an
 * image, the tag fields as read-only inputs — the same widgets the planned
 * edit mode will unlock — and the file-derived properties (format, duration,
 * path, timestamps) as plain text.
 */
export const MusicInfoDialog = () => {
  const t = useT();
  const music = useSyncExternalStore(
    musicInfoStore.subscribe,
    musicInfoStore.getSnapshot,
  );

  return (
    <Dialog
      open={music !== null}
      onOpenChange={(open) => {
        if (!open) {
          musicInfoStore.close();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("musicInfo.title")}</DialogTitle>
        </DialogHeader>
        {music !== null && (
          <DialogBody className="max-h-[65vh] overflow-y-auto">
            {music.picturePath !== null ? (
              <img
                src={toMediaFileUrl(music.picturePath)}
                alt=""
                className="size-32 self-center rounded-md object-cover"
              />
            ) : (
              <VStack className="size-32 shrink-0 self-center rounded-md bg-muted">
                <Disc3 aria-hidden className="size-10 text-muted-foreground" />
              </VStack>
            )}
            <div className="grid gap-2">
              <TagField
                label={t("musicInfo.field.title")}
                value={music.title}
              />
              <TagField
                label={t("musicInfo.field.artist")}
                value={music.artist}
              />
              <TagField
                label={t("musicInfo.field.albumArtist")}
                value={music.albumArtist}
              />
              <TagField
                label={t("musicInfo.field.album")}
                value={music.album}
              />
              <TagField
                label={t("musicInfo.field.genre")}
                value={music.genre}
              />
              <TagField
                label={t("musicInfo.field.year")}
                type="number"
                value={music.year}
              />
              <TagField
                label={t("musicInfo.field.track")}
                type="number"
                value={music.track}
              />
              <TagField
                label={t("musicInfo.field.disc")}
                type="number"
                value={music.disc}
              />
              <TagField
                label={t("musicInfo.field.composer")}
                value={music.composer}
              />
              <TagField
                label={t("musicInfo.field.lyricist")}
                value={music.lyricist}
              />
              <TagField
                label={t("musicInfo.field.producer")}
                value={music.producer}
              />
              <TagField
                label={t("musicInfo.field.conductor")}
                value={music.conductor}
              />
              <TagField
                label={t("musicInfo.field.publisher")}
                value={music.publisher}
              />
              <TagField
                label={t("musicInfo.field.bpm")}
                type="number"
                value={music.bpm}
              />
              <TagField
                label={t("musicInfo.field.rating")}
                type="number"
                value={music.rating}
              />
            </div>
            <div className="grid gap-2 border-t pt-3">
              <PropertyRow
                label={t("musicInfo.field.format")}
                value={music.audioFormat}
              />
              <PropertyRow
                label={t("musicInfo.field.duration")}
                value={formatTime(music.durationMs / 1000)}
              />
              <PropertyRow
                label={t("musicInfo.field.filePath")}
                value={music.filePath}
              />
              <PropertyRow
                label={t("musicInfo.field.addedAt")}
                value={formatDateTime(music.addedAt)}
              />
              <PropertyRow
                label={t("musicInfo.field.updatedAt")}
                value={formatDateTime(music.updatedAt)}
              />
            </div>
          </DialogBody>
        )}
      </DialogContent>
    </Dialog>
  );
};
