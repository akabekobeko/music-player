import type { Music } from "@mp/ipc";
import { DialogTabPanel } from "@/components/app/InfoDialog/DialogTabPanel";
import { PropertyRow } from "@/components/app/InfoDialog/PropertyRow";
import { useT } from "@/features/i18n/useT";
import { formatTime } from "@/libs/formatTime";

type Props = {
  /** Track whose file-derived properties are shown. */
  readonly music: Music;
};

/** ISO-8601 → locale-formatted date-time (raw string when unparsable). */
const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
};

/** "File" tab: the file-derived properties as plain text. */
export const FilePanel = ({ music }: Props) => {
  const t = useT();
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
