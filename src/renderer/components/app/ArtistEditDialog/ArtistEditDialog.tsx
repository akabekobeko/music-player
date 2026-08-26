import { UserRound } from "lucide-react";
import { InitialGrid } from "@/components/app/InitialGrid/InitialGrid";
import { Stack, VStack } from "@/components/app/stacks";
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
import { PropertyRow } from "./PropertyRow";
import { useArtistEditDialog } from "./useArtistEditDialog";

/**
 * Artist info dialog (context / row menu → "Artist Info"), mounted once in
 * the AppLayout (the menu that started the flow is gone by the time this
 * opens). Shows the current picture, previews a newly picked image file,
 * lists the artist's metadata (name, song count), and offers the initial
 * setting (A–Z overrides the automatic section, "Other" clears it); confirm
 * applies every change to the library. Header and footer stay put — only
 * the content area scrolls when it exceeds its height cap.
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("artistEdit.title")}</DialogTitle>
        </DialogHeader>
        {/* Mounted only while open so the native file input resets between
            edit sessions. */}
        {target !== null && (
          <Stack className="max-h-[65vh] gap-6 overflow-y-auto">
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
              <div className="grid w-full gap-2">
                <PropertyRow
                  label={t("artistEdit.field.name")}
                  value={target.name}
                />
                <PropertyRow
                  label={t("artistEdit.field.songCount")}
                  value={String(target.musicCount)}
                />
              </div>
            </VStack>
            <Stack className="gap-2">
              <h2 className="font-medium text-muted-foreground text-xs">
                {t("artistEdit.initial")}
              </h2>
              <InitialGrid
                selected={selectedInitial}
                onSelect={selectInitial}
                className="justify-items-center"
              />
            </Stack>
            {error !== null && (
              <p className="break-all text-destructive text-sm">
                {t("artistEdit.failed", { message: error.message })}
              </p>
            )}
          </Stack>
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
