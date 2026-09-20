import { useSyncExternalStore } from "react";
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
import { albumInfoStore } from "@/features/library/albumInfoStore";
import { DialogTabList } from "../DialogTabList";
import { PicturePanel } from "../PicturePanel";
import { DetailsPanel } from "./DetailsPanel";

/**
 * Album info dialog (album menu → "Album Info"), mounted once in the
 * AppLayout (the menu that started the flow is gone by the time this opens).
 *
 * Shows the summary-line facts of the Artist / Album views and the artwork
 * split into two tabs, "Details" and "Artwork" (aspect-fit), laid out like
 * the song info dialog: the body has a fixed height so the popup keeps its
 * size while switching tabs, and the footer holds Cancel.
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
      <DialogContent className="sm:max-w-lg md:max-w-2xl xl:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("albumInfo.title")}</DialogTitle>
        </DialogHeader>
        {album !== null && (
          <DialogBody className="h-[60vh] px-0 pb-0">
            <Tabs defaultValue="details" className="min-h-0 flex-1">
              <DialogTabList>
                <TabsTrigger value="details">
                  {t("albumInfo.tab.details")}
                </TabsTrigger>
                <TabsTrigger value="picture">
                  {t("albumInfo.tab.picture")}
                </TabsTrigger>
              </DialogTabList>
              <DetailsPanel album={album} />
              <PicturePanel value="picture" picturePath={album.picturePath} />
            </Tabs>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => albumInfoStore.close()}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
