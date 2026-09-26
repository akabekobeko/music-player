import { Fragment, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/features/i18n/useT";
import { albumInfoStore } from "@/features/library/albumInfoStore";
import { DialogTabList } from "../DialogTabList";
import { InfoDialogHeader } from "../InfoDialogHeader";
import { PicturePanel } from "../PicturePanel";
import { DetailsPanel } from "./DetailsPanel";

/**
 * Album info dialog (album menu → "Album Info"), mounted once in the
 * AppLayout (the menu that started the flow is gone by the time this opens).
 *
 * Shows the summary-line facts of the Artist / Album views and the artwork
 * split into two tabs, "Details" and "Artwork" (aspect-fit), laid out like
 * the song info dialog: the body has a fixed height so the popup keeps its
 * size while switching tabs, and the footer holds Cancel. The header's
 * arrows step to the neighbouring albums of the list the album was opened
 * from; the open tab survives the step.
 */
export const AlbumInfoDialog = () => {
  const t = useT();
  const state = useSyncExternalStore(
    albumInfoStore.subscribe,
    albumInfoStore.getSnapshot,
  );
  const album = state?.album ?? null;

  return (
    <Dialog
      open={album !== null}
      onOpenChange={(open) => {
        if (!open) {
          albumInfoStore.close();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg md:max-w-2xl xl:max-w-3xl"
      >
        <InfoDialogHeader
          title={t("albumInfo.title")}
          navigation={{
            previousLabel: t("albumInfo.previous"),
            nextLabel: t("albumInfo.next"),
            hasPrevious: state !== null && state.previous !== null,
            hasNext: state !== null && state.next !== null,
            onPrevious: () => albumInfoStore.previous(),
            onNext: () => albumInfoStore.next(),
          }}
        />
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
              {/* Keyed so a step to another album starts the panels afresh
                  (aspect-fit ratio, scroll position) while the open tab
                  survives with the Tabs above. */}
              <Fragment key={album.key}>
                <DetailsPanel album={album} />
                <PicturePanel value="picture" picturePath={album.picturePath} />
              </Fragment>
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
