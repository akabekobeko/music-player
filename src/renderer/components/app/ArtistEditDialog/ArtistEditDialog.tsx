import { UserRound } from "lucide-react";
import { VStack } from "@/components/app/stacks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { useArtistEditDialog } from "./useArtistEditDialog";

/**
 * Artist edit dialog (context / row menu → "Edit"), mounted once in the
 * AppLayout (the menu that started the flow is gone by the time this
 * opens). Shows the current picture, previews a newly picked image file,
 * and applies it to the library on confirm.
 */
export const ArtistEditDialog = () => {
  const t = useT();
  const { target, previewUrl, canApply, error, selectFile, apply, close } =
    useArtistEditDialog();
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {target !== null && t("artistEdit.title", { name: target.name })}
          </DialogTitle>
        </DialogHeader>
        {/* Mounted only while open so the native file input resets between
            edit sessions. */}
        {target !== null && (
          <VStack className="gap-4">
            {imageUrl !== null ? (
              <img
                src={imageUrl}
                alt=""
                className="size-32 rounded-full object-cover"
              />
            ) : (
              <VStack className="size-32 rounded-full bg-muted">
                <UserRound
                  aria-hidden
                  className="size-12 text-muted-foreground"
                />
              </VStack>
            )}
            <Input
              type="file"
              accept="image/*"
              aria-label={t("artistEdit.imageFile")}
              onChange={(event) => {
                const picked = event.target.files?.[0];
                if (picked !== undefined) {
                  selectFile(picked);
                }
              }}
            />
          </VStack>
        )}
        {error !== null && (
          <p className="break-all text-destructive text-sm">
            {t("artistEdit.failed", { message: error.message })}
          </p>
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
