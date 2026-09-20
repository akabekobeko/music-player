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
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { DialogTabList } from "../DialogTabList";
import { DetailsPanel } from "./DetailsPanel";
import { PicturePanel } from "./PicturePanel";
import { useArtistEditDialog } from "./useArtistEditDialog";

/**
 * Artist info dialog (context / row menu → "Artist Info"), mounted once in
 * the AppLayout (the menu that started the flow is gone by the time this
 * opens). Split into two tabs like the song info dialog: "Details" (name,
 * song count and the initial setting — A–Z overrides the automatic section,
 * "Other" clears it) and "Picture" (the current picture, previewing a newly
 * picked image file). Every pick lives in `useArtistEditDialog`, not in the tabs,
 * so switching tabs keeps it and Apply commits the picks of every tab at
 * once. The body has a fixed height so the popup keeps its size while
 * switching tabs; an apply failure shows under the tabs whichever tab is
 * open.
 */
export const ArtistEditDialog = () => {
  const t = useT();
  const {
    target,
    previewUrl,
    selectedInitial,
    canApply,
    error,
    selectFile,
    selectInitial,
    apply,
    close,
  } = useArtistEditDialog();
  const imageUrl =
    previewUrl ??
    (target !== null && target.picturePath !== null
      ? toMediaFileUrl(target.picturePath)
      : null);

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("artistEdit.title")}</DialogTitle>
        </DialogHeader>
        {/* Mounted only while open so the native file input resets between
            edit sessions. */}
        {target !== null && (
          <DialogBody className="h-[60vh] px-0 pb-0">
            <Tabs defaultValue="details" className="min-h-0 flex-1">
              <DialogTabList>
                <TabsTrigger value="details">
                  {t("artistEdit.tab.details")}
                </TabsTrigger>
                <TabsTrigger value="picture">
                  {t("artistEdit.tab.picture")}
                </TabsTrigger>
              </DialogTabList>
              <DetailsPanel
                target={target}
                selectedInitial={selectedInitial}
                onSelectInitial={selectInitial}
              />
              <PicturePanel imageUrl={imageUrl} onSelectFile={selectFile} />
            </Tabs>
            {error !== null && (
              <p className="break-all px-4 pb-4 text-destructive text-sm">
                {t("artistEdit.failed", { message: error.message })}
              </p>
            )}
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!canApply} onClick={() => void apply()}>
            {t("artistEdit.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
