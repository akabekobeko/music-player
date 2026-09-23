import type { Music } from "@mp/ipc";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/features/i18n/useT";
import { DialogTabList } from "../DialogTabList";
import { ApplyFailures } from "./ApplyFailures";
import { ArtworkPanel } from "./ArtworkPanel";
import { DetailsPanel } from "./DetailsPanel";
import { FilePanel } from "./FilePanel";
import { useMusicInfoDialog } from "./useMusicInfoDialog";

type Props = {
  /** Tracks under edit; never empty. */
  readonly musics: readonly Music[];
  /** The first track (seeds the form and the File tab). */
  readonly primary: Music;
};

/**
 * One session of the music info dialog: the popup with its three tabs and
 * the Cancel / Apply footer. Owns the `Dialog` root so every way of closing
 * (Cancel, Esc, backdrop, the X) goes through the hook's `close`, which
 * refuses while an apply runs. The parent remounts this component per
 * track set, so the form starts from the right defaults every time.
 */
export const MusicInfoDialogContent = ({ musics, primary }: Props) => {
  const t = useT();
  const {
    form,
    imageUrl,
    canRemoveArtwork,
    unsupportedImageType,
    stopsPlayback,
    applying,
    progress,
    canApply,
    error,
    failures,
    selectFile,
    removeArtwork,
    apply,
    close,
  } = useMusicInfoDialog(musics, primary);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg md:max-w-2xl xl:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("musicInfo.title")}</DialogTitle>
        </DialogHeader>
        <DialogBody className="h-[60vh] px-0 pb-0">
          <Tabs defaultValue="details" className="min-h-0 flex-1">
            <DialogTabList>
              <TabsTrigger value="details">
                {t("musicInfo.tab.details")}
              </TabsTrigger>
              <TabsTrigger value="picture">
                {t("musicInfo.tab.picture")}
              </TabsTrigger>
              <TabsTrigger value="file">{t("musicInfo.tab.file")}</TabsTrigger>
            </DialogTabList>
            <DetailsPanel
              form={form}
              requireTitle={musics.length === 1}
              disabled={applying}
            />
            <ArtworkPanel
              imageUrl={imageUrl}
              canRemove={canRemoveArtwork}
              unsupportedImageType={unsupportedImageType}
              disabled={applying}
              onSelectFile={selectFile}
              onRemove={removeArtwork}
            />
            <FilePanel music={primary} />
          </Tabs>
          {error !== null && (
            <p className="shrink-0 break-all px-4 pb-4 text-destructive text-sm">
              {t("musicInfo.failed", { message: error.message })}
            </p>
          )}
          {failures.length > 0 && <ApplyFailures failures={failures} />}
        </DialogBody>
        <DialogFooter
          leading={
            stopsPlayback ? (
              <p className="text-muted-foreground text-xs">
                {t("musicInfo.willStopPlayback")}
              </p>
            ) : undefined
          }
        >
          <Button variant="outline" disabled={applying} onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!canApply} onClick={() => void apply()}>
            {applying && <Loader2 className="animate-spin" />}
            {progress !== null
              ? `${progress.current} / ${progress.total}`
              : t("musicInfo.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
