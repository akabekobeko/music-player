import { useT } from "@/features/i18n/useT";
import type { AlbumInfoTarget } from "@/features/library/albumInfoStore";
import { formatTime } from "@/libs/formatTime";
import { DialogTabPanel } from "../DialogTabPanel";
import { PropertyRow } from "../PropertyRow";

type Props = {
  /** Album whose summary facts are shown. */
  readonly album: AlbumInfoTarget;
};

/** "Details" tab: the summary-line facts of the Artist / Album views. */
export const DetailsPanel = ({ album }: Props) => {
  const t = useT();
  return (
    <DialogTabPanel value="details" className="overflow-y-auto">
      <div className="grid gap-2">
        <PropertyRow label={t("albumInfo.field.album")} value={album.album} />
        <PropertyRow label={t("albumInfo.field.artist")} value={album.artist} />
        <PropertyRow
          label={t("albumInfo.field.year")}
          value={album.year !== null ? String(album.year) : ""}
        />
        <PropertyRow label={t("albumInfo.field.genre")} value={album.genre} />
        <PropertyRow
          label={t("albumInfo.field.songCount")}
          value={String(album.musicCount)}
        />
        <PropertyRow
          label={t("albumInfo.field.duration")}
          value={formatTime(album.totalDurationMs / 1000)}
        />
      </div>
    </DialogTabPanel>
  );
};
