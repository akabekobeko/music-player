import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/features/i18n/useT";
import { useLibraryRemoveDialog } from "./useLibraryRemoveDialog";

/**
 * Artist / album removal confirmation (context or row menu → "Remove from
 * library"), mounted once in the AppLayout (the menu that started the flow
 * is gone by the time this opens). The removal itself is in
 * `useLibraryRemoveDialog`.
 */
export const LibraryRemoveDialog = () => {
  const t = useT();
  const { target, name, confirm, close } = useLibraryRemoveDialog();

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("library.removeTitle")}</DialogTitle>
          <DialogDescription className="whitespace-pre-line break-all">
            {t(
              target?.kind === "artist"
                ? "library.removeArtistMessage"
                : "library.removeAlbumMessage",
              { name },
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={() => void confirm()}>
            {t("library.remove")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
