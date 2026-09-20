import type { Music } from "@mp/ipc";
import { useT } from "@/features/i18n/useT";
import { DialogTabPanel } from "../DialogTabPanel";
import { TagField } from "./TagField";

type Props = {
  /** Track whose tag fields are shown. */
  readonly music: Music;
};

/** "Details" tab: the tag fields as read-only inputs. */
export const DetailsPanel = ({ music }: Props) => {
  const t = useT();
  return (
    <DialogTabPanel value="details" className="overflow-y-auto">
      <div className="grid gap-2">
        <TagField label={t("musicInfo.field.title")} value={music.title} />
        <TagField label={t("musicInfo.field.artist")} value={music.artist} />
        <TagField
          label={t("musicInfo.field.albumArtist")}
          value={music.albumArtist}
        />
        <TagField label={t("musicInfo.field.album")} value={music.album} />
        <TagField label={t("musicInfo.field.genre")} value={music.genre} />
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
    </DialogTabPanel>
  );
};
