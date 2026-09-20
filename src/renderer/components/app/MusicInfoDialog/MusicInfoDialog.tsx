import { useSyncExternalStore } from "react";
import { DialogTabList } from "@/components/app/InfoDialog/DialogTabList";
import { PicturePanel } from "@/components/app/InfoDialog/PicturePanel";
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
import { musicInfoStore } from "@/features/library/musicInfoStore";
import { DetailsPanel } from "./DetailsPanel";
import { FilePanel } from "./FilePanel";

/**
 * Track info dialog (track row menu → "Song info"), mounted once in the
 * AppLayout (the menu that started the flow is gone by the time this opens).
 *
 * Shows every user-facing column of the `musics` row split into three tabs:
 * "Details" (the tag fields as read-only inputs — the same widgets the
 * planned edit mode will unlock), "Artwork" (the picture, aspect-fit) and
 * "File" (the file-derived properties as plain text). The body has a fixed
 * height so the popup keeps its size while switching tabs. The footer holds
 * only Cancel for now; the edit mode will add OK next to it.
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
          <DialogBody className="h-[60vh] px-0 pb-0">
            <Tabs defaultValue="details" className="min-h-0 flex-1">
              <DialogTabList>
                <TabsTrigger value="details">
                  {t("musicInfo.tab.details")}
                </TabsTrigger>
                <TabsTrigger value="picture">
                  {t("musicInfo.tab.picture")}
                </TabsTrigger>
                <TabsTrigger value="file">
                  {t("musicInfo.tab.file")}
                </TabsTrigger>
              </DialogTabList>
              <DetailsPanel music={music} />
              <PicturePanel value="picture" picturePath={music.picturePath} />
              <FilePanel music={music} />
            </Tabs>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => musicInfoStore.close()}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
