import type { Music } from "@mp/ipc";
import { useT } from "@/features/i18n/useT";
import { formatTime } from "@/libs/formatTime";
import { DialogTabPanel } from "../DialogTabPanel";
import { PropertyRow } from "../PropertyRow";

type Props = {
  /** Tracks under edit; never empty. */
  readonly musics: readonly Music[];
  /** The first track, whose file-derived properties a single edit shows. */
  readonly primary: Music;
};

/** ISO-8601 → locale-formatted date-time (raw string when unparsable). */
const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
};

/**
 * "File" tab: a single track's file-derived properties as plain text; for
 * several tracks, the list of targets (title and file path,
 * `docs/specs/v1.1/features/music-info-dialog.md`).
 */
export const FilePanel = ({ musics, primary }: Props) => {
  const t = useT();
  if (musics.length > 1) {
    return (
      <DialogTabPanel value="file" className="overflow-y-auto">
        <ul className="grid gap-2">
          {musics.map((music) => (
            <li key={music.id} className="grid gap-0.5">
              <span className="text-sm">{music.title}</span>
              <span className="break-all text-muted-foreground text-xs">
                {music.filePath}
              </span>
            </li>
          ))}
        </ul>
      </DialogTabPanel>
    );
  }

  const music = primary;
  return (
    <DialogTabPanel value="file" className="overflow-y-auto">
      <div className="grid gap-2">
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
    </DialogTabPanel>
  );
};
